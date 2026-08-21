"""
Ajusta parâmetros do material de um .glb editando SÓ o chunk JSON.

O binário (geometria e texturas) é copiado byte a byte — nada é
descomprimido nem recodificado.

uso: ajusta-material-glb.py entrada.glb saida.glb METALLIC ROUGHNESS NORMAL_SCALE
"""
import json
import struct
import sys

origem, destino = sys.argv[1], sys.argv[2]
metallic, roughness, normal_scale = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])

d = open(origem, 'rb').read()
magic, versao, _ = struct.unpack_from('<III', d, 0)
assert magic == 0x46546C67, 'não é GLB'

off, chunks = 12, []
while off < len(d):
    clen, ctype = struct.unpack_from('<II', d, off)
    chunks.append([ctype, bytearray(d[off + 8: off + 8 + clen])])
    off += 8 + clen + ((4 - clen % 4) % 4)

j = json.loads(chunks[0][1].decode('utf-8'))
for m in j.get('materials', []):
    pbr = m.setdefault('pbrMetallicRoughness', {})
    print(f"  metallic {pbr.get('metallicFactor', 1)} -> {metallic} | "
          f"roughness {pbr.get('roughnessFactor', 1)} -> {roughness}")
    pbr['metallicFactor'], pbr['roughnessFactor'] = metallic, roughness
    if 'normalTexture' in m:
        print(f"  normal scale {m['normalTexture'].get('scale', 1)} -> {normal_scale}")
        m['normalTexture']['scale'] = normal_scale

js = json.dumps(j, separators=(',', ':')).encode('utf-8')
js += b' ' * ((4 - len(js) % 4) % 4)
corpo = struct.pack('<II', len(js), 0x4E4F534A) + js
for ctype, payload in chunks[1:]:
    pad = b'\x00' * ((4 - len(payload) % 4) % 4)
    corpo += struct.pack('<II', len(payload), ctype) + bytes(payload) + pad
open(destino, 'wb').write(struct.pack('<III', magic, versao, 12 + len(corpo)) + corpo)
print(f'{destino}: ok')
