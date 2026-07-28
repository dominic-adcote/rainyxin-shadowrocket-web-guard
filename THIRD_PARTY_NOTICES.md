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
and Hong Kong and United States local advertising hosts. The normalized,
deduplicated outputs are stored in
`blocklists/imported-special-app-ad-domains.csv` and
`blocklists/imported-niche-local-ad-domains.txt`.

The supplied files did not include per-entry provenance, a reproducible
collection script, or a third-party license statement. These entries are not
represented as independently verified or covered by the third-party licenses
listed above.
