export function checkImage(imageSrc: string) {
    return new Promise((resolve) => {
      const img = new Image();
  
      img.onload = () => {
        resolve(true);
      };
  
      img.onerror = () => {
        resolve(false);
      };
      img.src = imageSrc;
    });
  }