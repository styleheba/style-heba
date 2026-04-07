/**
 * 이미지를 4:5 비율(인스타그램 피드)로 자동 크롭 및 리사이즈
 * 목표 크기: 1080 x 1350px
 */

export interface ImageCropOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export async function cropImageTo4x5(
  file: File,
  options: ImageCropOptions = {}
): Promise<File> {
  const {
    targetWidth = 1080,
    targetHeight = 1350,
    quality = 0.9,
    format = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas를 생성할 수 없습니다.'));
            return;
          }

          // 목표 비율: 4:5
          const targetRatio = 4 / 5;
          const currentRatio = img.width / img.height;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          // 현재 이미지가 목표보다 넓은 경우 (가로를 자름)
          if (currentRatio > targetRatio) {
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
          }
          // 현재 이미지가 목표보다 좁은 경우 (세로를 자름)
          else if (currentRatio < targetRatio) {
            sourceHeight = img.width / targetRatio;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // Canvas 크기 설정
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // 크롭 및 리사이즈
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Canvas를 Blob으로 변환
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('이미지 처리에 실패했습니다.'));
                return;
              }

              // 파일 확장자 결정
              const extension = format === 'image/png' ? 'png' : 
                                format === 'image/webp' ? 'webp' : 'jpg';
              
              // 원본 파일명에서 확장자를 제거하고 새 확장자 추가
              const originalName = file.name.replace(/\.[^/.]+$/, '');
              const newFileName = `${originalName}_1080x1350.${extension}`;

              // File 객체로 변환
              const croppedFile = new File([blob], newFileName, { type: format });

              resolve(croppedFile);
            },
            format,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지를 불러올 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 여러 이미지를 한번에 크롭
 */
export async function cropMultipleImagesTo4x5(
  files: File[],
  options?: ImageCropOptions
): Promise<File[]> {
  const promises = files.map((file) => cropImageTo4x5(file, options));
  return Promise.all(promises);
}

/**
 * 이미지 비율 검증
 */
export function validateImageRatio(
  width: number,
  height: number,
  targetRatio: number = 4 / 5,
  tolerance: number = 0.01
): boolean {
  const ratio = width / height;
  return Math.abs(ratio - targetRatio) <= tolerance;
}

/**
 * 이미지 파일 정보 추출
 */
export async function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  ratio: number;
  is4x5: boolean;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const ratio = img.width / img.height;
        const is4x5 = validateImageRatio(img.width, img.height);

        resolve({
          width: img.width,
          height: img.height,
          ratio,
          is4x5,
        });
      };

      img.onerror = () => {
        reject(new Error('이미지를 불러올 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
}
