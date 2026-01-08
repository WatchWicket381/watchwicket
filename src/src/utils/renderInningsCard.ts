import html2canvas from "html2canvas";

export async function renderInningsCardToImage(
  rootElementId: string
): Promise<Blob | null> {
  const element = document.getElementById(rootElementId);
  if (!element) {
    console.error(`Element with id "${rootElementId}" not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#020617",
      scale: 2,
      logging: false,
      useCORS: true,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  } catch (error) {
    console.error("Error rendering innings card:", error);
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadInningsCard(
  rootElementId: string,
  teamName: string
): Promise<{ success: boolean; method: "share" | "download" | null }> {
  const blob = await renderInningsCardToImage(rootElementId);

  if (!blob) {
    return { success: false, method: null };
  }

  const filename = `watchwicket-innings-${teamName.replace(/\s+/g, "-").toLowerCase()}.png`;

  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: "image/png" });
      const canShareFiles = navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          files: [file],
          title: "WatchWicket ScoreBox – Innings Summary",
          text: `${teamName} Innings Summary`,
        });
        return { success: true, method: "share" };
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  }

  downloadBlob(blob, filename);
  return { success: true, method: "download" };
}
