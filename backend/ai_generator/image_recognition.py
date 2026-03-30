from PIL import Image
import numpy as np
from paddleocr import PaddleOCR

def ocr_init(language):
    if language == "Japanese":
        ocr = PaddleOCR(use_angle_cls=True, lang='japan')
    if language == "Chinese":
        ocr = PaddleOCR(use_angle_cls=True, lang='ch')
    return ocr

def get_text_from_image(imageFile, language):
    ocr = ocr_init(language)

    image = Image.open(imageFile).convert("RGB")
    img_array = np.array(image)
    result = ocr.ocr(img_array)
            
    text = " ".join(
                word[1][0]
                for line in result
                for word in line
            )

    # Print results
    for line in result:
        for word in line:
            print(word[1][0])  # detected text
    return text