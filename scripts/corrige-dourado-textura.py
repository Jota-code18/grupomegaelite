"""
Enriquece o dourado da textura do escudo.

O modelo do Meshy pinta as letras com um degradê que termina em branco. Como
isso está na textura (não na luz), baixar a exposição só escurecia o conjunto.
Aqui a correção é cirúrgica: só os pixels quentes (R > B) — e a vizinhança
deles, para pegar as pontas já esbranquiçadas — têm o brilho contido e a
saturação levantada. O prata do escudo, que é neutro, não é tocado.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

entrada, saida = sys.argv[1], sys.argv[2]
V_MAX = float(sys.argv[3])  # teto de brilho dentro da máscara
S_MIN = float(sys.argv[4])  # piso de saturação para pixels claros

im = Image.open(entrada).convert('RGB')
arr = np.asarray(im).astype(np.float32) / 255.0
r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

# Máscara do dourado, dilatada para alcançar as pontas que já viraram branco.
quente = ((r - b) > 0.05).astype(np.uint8) * 255
mask = Image.fromarray(quente).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(9))
m = np.asarray(mask).astype(np.float32) / 255.0

mx, mn = arr.max(axis=-1), arr.min(axis=-1)
v = mx
s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)

# Comprime o topo da faixa de brilho e garante cor mínima nos claros.
v_novo = np.where(v > V_MAX, V_MAX + (v - V_MAX) * 0.35, v)
s_novo = np.maximum(s, np.clip((v - 0.55) / 0.45, 0, 1) * S_MIN)

# Aplica só dentro da máscara (transição suave nas bordas).
v_fin = v * (1 - m) + v_novo * m
s_fin = s * (1 - m) + s_novo * m

# Reconstrói mantendo o matiz: reescala o vetor de cor e reinjeta saturação.
escala = np.where(v > 0, v_fin / np.maximum(v, 1e-6), 1)[..., None]
out = arr * escala
mx2 = out.max(axis=-1, keepdims=True)
alvo_min = mx2 * (1 - s_fin[..., None])
mn2 = out.min(axis=-1, keepdims=True)
denom = np.maximum(mx2 - mn2, 1e-6)
out = mx2 - (mx2 - out) * ((mx2 - alvo_min) / denom)

Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)).save(
    saida, 'JPEG', quality=94, optimize=True, subsampling=0)
print(f'{saida}: máscara cobre {m.mean()*100:.1f}% da textura (V_MAX={V_MAX}, S_MIN={S_MIN})')
