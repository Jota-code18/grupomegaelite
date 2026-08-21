"""
Escurece os cinzas médios da textura do escudo.

O modelo do Meshy entrega os contornos prateados claros demais e com pouco
contraste, o que soma ao aspecto de massinha. Aqui só os pixels NEUTROS são
tocados (o dourado fica de fora), e a força segue uma curva em sino centrada
no meio-tom: o texto branco ("GRUPO", "Vigilância e Segurança") e os pretos
ficam onde estão, só os cinzas de contorno descem.

uso: escurece-cinzas-textura.py entrada.jpg saida.jpg FORCA CENTRO
"""
import sys

import numpy as np
from PIL import Image

entrada, saida = sys.argv[1], sys.argv[2]
FORCA = float(sys.argv[3])   # quanto o meio-tom escurece (0.18 = 18%)
CENTRO = float(sys.argv[4])  # brilho onde o efeito é máximo

arr = np.asarray(Image.open(entrada).convert('RGB')).astype(np.float32) / 255.0
mx, mn = arr.max(axis=-1), arr.min(axis=-1)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)

# Só o que é neutro (prata/cinza); transição suave para não criar borda.
neutro = np.clip((0.22 - sat) / 0.22, 0, 1)
# Sino: força máxima no meio-tom, zero no branco e no preto.
sino = np.exp(-((mx - CENTRO) ** 2) / (2 * 0.19 ** 2))

fator = 1.0 - FORCA * neutro * sino
out = np.clip(arr * fator[..., None], 0, 1)

Image.fromarray((out * 255).astype(np.uint8)).save(
    saida, 'JPEG', quality=94, optimize=True, subsampling=0)
print(f'{saida}: cinzas escurecidos (força={FORCA}, centro={CENTRO}); '
      f'área afetada {(neutro * sino > 0.15).mean() * 100:.1f}%')
