let assetTarget;
let operationDone = true;

function _isVideo(url) {
  return /^https:\/\/video\-public\.canva\.com/.test(url);
}

async function getAsset(url) {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) return null;

  const size = response.headers.get("Content-Length");
  const resBlob = await response.blob();
  if (resBlob.type.startsWith("image/") && resBlob.type != "image/png") {
    const blob = await webpToPngBlob(resBlob);
    return await getAsset(URL.createObjectURL(blob));
  }
  return resBlob;
}

async function webpToPngBlob(webpBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const img = new Image();

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (pngBlob) => {
            if (pngBlob) resolve(pngBlob);
            else reject(new Error("Failed to convert to PNG Blob."));
          },
          "image/png",
          1, // Optional: image quality (0-1) for PNG is generally lossless
        );
      };

      img.onerror = () => reject(new Error("Failed to load the WebP image."));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Failed to read the WebP Blob."));
    reader.readAsDataURL(webpBlob);
  });
}

async function getPro(url, isVideo = false) {
  try {
    if (!isVideo) {
      const blob = await getAsset(url);
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(url);
    }
    showNotification(`${isVideo ? "Video URL" : "Image"} copied!`);
  } catch (err) {
    console.log(err);
    showNotification(`Failed to copy asset!`, "rgba(219, 0, 0, 0.8)", "#fff");
  }
}
function showNotification(
  message,
  bg = "rgba(106, 230, 92, 0.8)",
  color = "#000",
) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.fontSize = "1.5rem";
  notification.style.fontFamily = "monospace";
  notification.style.right = "20px";
  notification.style.backgroundColor = bg;
  notification.style.color = color;
  notification.style.padding = "10px 15px";
  notification.style.borderRadius = "5px";
  notification.style.borderWidth = "1px";
  notification.style.borderColor = "#000";
  notification.style.borderStyle = "solid";
  notification.style.zIndex = "10000"; // Pastikan di atas elemen lain
  notification.style.opacity = "0";
  notification.style.transition = "opacity 0.3s ease-in-out";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "1";
  }, 10);

  clearTimeout(1000);
  notificationTimeout = setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

window.onmouseover = function (e) {
  const target = e.target;
  if (target.className == "Fjcg6g Lmvvew _3zJSg _682gpw") {
    const parent = target.parentElement;
    const isPro = parent.querySelector(`[class="uRWxVA dkWypw KNAong"] > svg`);
    if (isPro) {
      assetTarget = parent;
    } else {
      assetTarget = null;
    }
  } else {
    assetTarget = null;
  }
};

window.onkeydown = async function (e) {
  try {
    if (e.ctrlKey && e.altKey && (e.which || e.keyCode) == 67 && assetTarget) {
      if (!operationDone) return;
      operationDone = false;

      let url = assetTarget.querySelector("img").src;
      const isVideo = _isVideo(url);
      if (isVideo) {
        const videoEl = assetTarget.querySelector("video");
        if (videoEl) url = videoEl.src;
        else throw "Video not loaded";
      }
      await getPro(url, isVideo);
    }
  } catch (err) {
    console.error(err);
    showNotification(`Failed to copy asset!`, "rgba(219, 0, 0, 0.8)", "#fff");
  } finally {
    setTimeout(() => {
      operationDone = true;
    }, 2500);
  }
};
