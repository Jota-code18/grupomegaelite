"""Troca uma imagem embutida num .glb, remontando o chunk binário.

Cada bufferView é copiado na ordem, com alinhamento de 4 bytes, e só os
byteOffset são recalculados — a geometria não é tocada nem recomprimida.
"""
import json
import struct
import sys

origem, destino, nova_img, idx_alvo = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])

d = open(origem, 'rb').read()
magic, versao, _ = struct.unpack_from('<III', d, 0)
assert magic == 0x46546C67, 'não é GLB'

off, chunks = 12, []
while off < len(d):
    clen, ctype = struct.unpack_from('<II', d, off)
    chunks.append((ctype, d[off + 8: off + 8 + clen]))
    off += 8 + clen + ((4 - clen % 4) % 4)

j = json.loads(chunks[0][1].decode('utf-8'))
bina = chunks[1][1]

# Dados atuais de cada bufferView.
dados = []
for bv in j['bufferViews']:
    ini = bv.get('byteOffset', 0)
    dados.append(bytearray(bina[ini:ini + bv['byteLength']]))

bv_img = j['images'][idx_alvo]['bufferView']
novo = open(nova_img, 'rb').read()
print(f"imagem {idx_alvo}: {len(dados[bv_img])/1048576:.2f} MB -> {len(novo)/1048576:.2f} MB")
dados[bv_img] = bytearray(novo)

# Remonta o binário recalculando offsets.
saida = bytearray()
for i, bv in enumerate(j['bufferViews']):
    while len(saida) % 4:
        saida.append(0)
    bv['byteOffset'] = len(saida)
    bv['byteLength'] = len(dados[i])
    saida.extend(dados[i])
while len(saida) % 4:
    saida.append(0)
j['buffers'][0]['byteLength'] = len(saida)

js = json.dumps(j, separators=(',', ':')).encode('utf-8')
js += b' ' * ((4 - len(js) % 4) % 4)
corpo = struct.pack('<II', len(js), 0x4E4F534A) + js + \
        struct.pack('<II', len(saida), 0x004E4942) + bytes(saida)
open(destino, 'wb').write(struct.pack('<III', magic, versao, 12 + len(corpo)) + corpo)
print(f"{destino}: {(12+len(corpo))/1048576:.2f} MB")
