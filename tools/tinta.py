# -*- coding: utf-8 -*-
"""Tira a tinta real (preto e cinza) das peças do Bruno: máscara do braço (BiRefNet) +
L dividido pelo tom local da pele. Saída: assets/hero/<n>.webp (1024², 0 = pele, 255 = preto) e provas em _ref/estudo."""
import json, glob, os, cv2, numpy as np
from pathlib import Path
from PIL import Image
from rembg import new_session, remove
S = Path(__file__).resolve().parent.parent; R = S.parent / '_ref'
N = 1024
PECAS = [(17, 'velho'), (82, 'poseidon'), (105, 'lobo'), (52, 'olho')]
H = json.load(open(R / 'ig/dados.json', encoding='utf-8'))
fs = sorted(glob.glob(str(R / 'ig/*_0.jpg'))); fs.sort(key=lambda f: -H.get(os.path.basename(f)[:-6], {}).get('likes', 0))
C = [os.path.basename(f)[:-6] for f in fs]
ses = new_session('birefnet-general-lite')

def tinta(im):
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)
    L = cv2.fastNlMeansDenoising(lab[..., 0], None, h=3, templateWindowSize=7, searchWindowSize=21).astype(np.float32)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (91, 91))
    f = cv2.GaussianBlur(cv2.morphologyEx(L, cv2.MORPH_CLOSE, k), (0, 0), 40)
    return L / np.maximum(f, 1)

def regiao(t):
    f = (t > .3).astype(np.uint8)
    f = cv2.morphologyEx(f, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    n, l, st, _ = cv2.connectedComponentsWithStats(f, connectivity=8)
    big = st[1:, cv2.CC_STAT_AREA].max(); reg = np.zeros_like(f)
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] > big * .04: reg[l == k] = 1
    reg = cv2.morphologyEx(reg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (101, 101)))
    reg = cv2.morphologyEx(reg, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    return cv2.GaussianBlur(reg.astype(np.float32), (0, 0), 10)

prov = []
for i, nome in PECAS:
    im = cv2.imread(str(R / f'ig/{C[i]}_0.jpg'))
    m = np.array(remove(Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)), session=ses, only_mask=True)).astype(np.float32) / 255
    m = cv2.erode((m > .5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(np.float32)
    m = cv2.GaussianBlur(m, (0, 0), 9)
    r = tinta(im)
    pele = np.percentile(r[m > .9], 92)
    preto = np.percentile(r[m > .9], 1.5)
    t = np.clip((pele * .985 - r) / (pele * .985 - preto), 0, 1) ** .9 * m
    t = np.clip((t - .05) / .95, 0, 1) * regiao(t)
    hh, ww = t.shape; yy, xx = np.mgrid[0:hh, 0:ww]
    t *= np.clip(np.minimum.reduce([xx, ww - 1 - xx, yy, hh - 1 - yy]) / (.06 * max(hh, ww)), 0, 1)
    h, w = t.shape; s = max(h, w)
    q = np.zeros((s, s), np.float32); q[(s - h) // 2:(s - h) // 2 + h, (s - w) // 2:(s - w) // 2 + w] = t
    q = cv2.resize(q, (N, N), interpolation=cv2.INTER_AREA)
    ys, xs = np.where(q > .2); cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    e = .9 * N / max(xs.max() - xs.min(), ys.max() - ys.min())
    q = np.clip(cv2.warpAffine(q, np.float32([[e, 0, N / 2 - cx * e], [0, e, N / 2 - cy * e]]), (N, N), flags=cv2.INTER_LANCZOS4), 0, 1)
    Q = np.full((s, s, 3), 236, np.uint8); Q[(s - h) // 2:(s - h) // 2 + h, (s - w) // 2:(s - w) // 2 + w] = im
    Q = cv2.resize(Q, (N, N), interpolation=cv2.INTER_AREA)
    Q = cv2.warpAffine(Q, np.float32([[e, 0, N / 2 - cx * e], [0, e, N / 2 - cy * e]]), (N, N), flags=cv2.INTER_LANCZOS4, borderValue=(221, 231, 236))
    cv2.imwrite(str(S / f'assets/hero/{nome}-foto.webp'), Q, [cv2.IMWRITE_WEBP_QUALITY, 86])
    cv2.imwrite(str(S / f'assets/hero/{nome}.webp'), (q * 255 + .5).astype(np.uint8), [cv2.IMWRITE_WEBP_QUALITY, 92])
    a = cv2.resize(im, (int(w * 400 / h), 400)); b = cv2.resize(((1 - q) * 235 + 10).astype(np.uint8), (400, 400))
    prov.append(np.concatenate([cv2.resize(a, (400, 400)), cv2.cvtColor(b, cv2.COLOR_GRAY2BGR)], 1))
    print(nome, C[i], im.shape[:2])
cv2.imwrite(str(R / 'estudo/tinta.jpg'), np.concatenate([np.concatenate(prov[:2], 1), np.concatenate(prov[2:], 1)], 0))
