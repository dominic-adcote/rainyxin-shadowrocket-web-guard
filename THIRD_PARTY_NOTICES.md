# Third-party notices

## StevenBlack/hosts

`blocklists/gambling-domains.csv` 中的 200 条域名取自 StevenBlack/hosts 的
`gambling-only` 数据；`blocklists/overseas-ad-domains-100.txt` 中的 100 条域名
取自 StevenBlack/hosts 主清单。两批数据分别使用 HaGeZi Gambling DNS Blocklist
和 Multi LIGHT 做独立交叉复核。

Source: <https://github.com/StevenBlack/hosts>

The MIT License (MIT)

Copyright © 2023 Steven Black

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## HaGeZi DNS Blocklists

HaGeZi Gambling DNS Blocklist is used only to independently cross-check the
selected StevenBlack entries. No domain unique to HaGeZi is included in this
batch.

Source: <https://github.com/hagezi/dns-blocklists>

HaGeZi DNS Blocklists are distributed under the GNU General Public License
version 3. See the upstream repository for the full license text.

## User-provided full domain collection

The repository owner directed the inclusion of the 2026-07-28 advertising and
tracker collection documented in `docs/FULL_DOMAIN_COLLECTION_REPORT.md`.
The supplied files did not include per-entry provenance, a reproducible
collection script, or a third-party license statement. They are therefore
identified separately from the StevenBlack-derived MIT data above and are not
represented as independently verified or covered by StevenBlack's license.

## User-provided special App and niche/local advertising lists

The repository owner also directed the inclusion of two 2026-07-28 local
files covering QQ Music, JD.com, Moji Weather, niche advertising networks,
and Hong Kong and United States local advertising hosts, plus a later
QQ Music/TME ecosystem supplement. The normalized, deduplicated outputs are stored in
`blocklists/imported-special-app-ad-domains.csv` and
`blocklists/imported-niche-local-ad-domains.txt`, with the supplement in
`blocklists/imported-qqmusic-extra-app-ad-domains.csv`.

The supplied files did not include per-entry provenance, a reproducible
collection script, or a third-party license statement. These entries are not
represented as independently verified or covered by the third-party licenses
listed above.

## User-provided 2026-07-29 all-domain collection

The repository owner supplied `all_ad_and_tracking_domains.txt`. The source
file did not include per-entry provenance or a license statement, so it was
not imported wholesale. `blocklists/audited-all-ad-tracking.list` contains
only exact domains that also appeared in both HaGeZi Multi Pro and the
StevenBlack unified hosts file at audit time, after protected infrastructure
and existing coverage were removed. The audit hashes and counts are recorded
in `blocklists/audited-all-ad-tracking.audit.json`.

## anti-AD and AdRules China advertising/CDN cross-check

`blocklists/cn-ad-cdn-2000.list` contains exact domains from anti-AD and
AdRules at audit time. Exact matches present in both sources are selected
first; the remainder comes from one of the sources after the same protected
infrastructure, sensitive-function, existing-coverage, and duplicate checks.
Source and output hashes are recorded in
`blocklists/cn-ad-cdn-2000.audit.json`.

anti-AD source: <https://github.com/privacy-protection-tools/anti-AD>

MIT License

Copyright (c) 2017-2019 gently

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

AdRules source: <https://github.com/Cats-Team/AdRules>

Copyright (C) 2026 by Cats-Team

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.

## Bilibili specialist verification sources

The exact hosts in `blocklists/bilibili-ad-domains.csv` were manually selected
after comparison against several public rule projects and live DNS. The
upstream lists are used as verification evidence; no complete upstream list,
script, or expression is copied into this repository.

- anti-AD, MIT: <https://github.com/privacy-protection-tools/anti-AD>
- AdRules, 0BSD: <https://github.com/Cats-Team/AdRules>
- HaGeZi DNS Blocklists, GPL-3.0:
  <https://github.com/hagezi/dns-blocklists>
- 217heidai/adblockfilters, GPL-3.0:
  <https://github.com/217heidai/adblockfilters>
- SukkaW/Surge, AGPL-3.0: <https://github.com/SukkaW/Surge>
- NobyDa/Script, GPL-3.0: <https://github.com/NobyDa/Script>

Per-source snapshot hashes, per-domain matches, and DNS answers are recorded
in `blocklists/bilibili-ad-domains.audit.json`.
