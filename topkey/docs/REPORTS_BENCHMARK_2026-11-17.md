# TOPKEY — Audit thiết kế báo cáo giải đấu theo benchmark quốc tế (17/11/2026)

## Trạng thái mã nguồn
- `main` sau PR #60: `36339c1939bfb0f2e730555d82b760c23c1cf56f`.
- Nhánh thay đổi cách ly: `feature/report-insights-benchmark-20261117`.
- Hiện tại `executive-dashboard.js` tổng hợp từ `tournamentIndex[*].finalReport`, các bản ghi đội, trận, tài chính và snapshot lãnh đạo (`associationDashboard`). Vai trò ADMIN có thể tổng hợp, BTC và lãnh đạo đủ quyền đọc snapshot. Không nên suy đoán thống kê cá nhân nếu chưa có nguồn.
- Hub có 7 môn, trong đó sáu môn được yêu cầu: bóng đá, cầu lông, bóng chuyền, chạy bộ, nấu ăn, DIY; đá cầu vẫn được giữ nguyên.

## Benchmark có thể kiểm tra lại (nghiên cứu giao diện/chức năng, không lấy dữ liệu)
| Môn | Website tham khảo | Mẫu trình bày | Nâng cấp TOPKEY |
|---|---|---|---|
| Bóng đá | Sofascore / Flashscore | Tab Matches–Standings–Details, Home/Away, điểm, hiệu số, phong độ | BXH lọc giải/bảng, lịch thi đấu và nhánh loại trực tiếp, xem chi tiết trận, chỉ số bàn thắng khi đã có dữ liệu |
| Cầu lông | TournamentSoftware / Badminton Canada | Bộ lọc nội dung MS/WS/MD/WD/XD, draw, schedule, scores | Báo cáo theo nội dung, điểm từng set, lọc vòng bảng/knock-out, giải thích tie-break |
| Bóng chuyền | Volleyball World / VNL | Schedule/Results và leaderboards theo kỹ năng scorer, attacker, blocker, server | Tỷ số set, kết quả trận, top tay ghi điểm/chắn/phát bóng khi đã lưu thống kê kỹ thuật |
| Chạy bộ | World Athletics / Athlinks | Kết quả theo cự ly/giới tính, thứ hạng, thành tích, age group | Overall/nam/nữ/nhóm tuổi, finish-time, pace chỉ khi có thời gian chính thức |
| Nấu ăn | Worldchefs | Phiếu chấm có tiêu chí, giám khảo chấm trên mobile, tổng hợp minh bạch | Rubric điểm, nhận xét, phân bố điểm, chứng chỉ/huy chương theo điều lệ giải |
| DIY | Devpost | Gallery bài dự thi, rubric giám khảo, tiến độ chấm, export dữ liệu | Gallery tác phẩm, thông tin/ảnh bài, bảng điểm tiêu chí và công bố Top 3 sau duyệt |

### Trang nguồn
- Sofascore standings: https://www.sofascore.com/football/tournament/europe/uefa-europa-conference-league/17015
- Flashscore standings: https://www.flashscore.com/football/thailand/thai-league-1/standings/KnDY5T7C/live-standings/
- TournamentSoftware badminton: https://badmintoncanada.tournamentsoftware.com/find/tournament
- Volleyball World statistics: https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/statistics/men/best-scorers/
- World Athletics road results: https://worldathletics.org/competition/calendar-results/results/7244879
- Worldchefs digital judging: https://worldchefs.org/digital-judging/
- Devpost judging: https://help.devpost.com/article/103-how-to-judge-an-online-hackathon

## Điểm yếu trong hệ thống hiện tại
1. Dashboard điều hành nhấn mạnh thống kê tài chính và tổ chức chung, chưa có mô-đun drilldown thống kê theo môn.
2. `compute` hiện có sự kiện/giải/đội/trận/số dư và nhà vô địch; không thấy mapping chuẩn chung cho bàn thắng cá nhân, ghi điểm tấn công bóng chuyền, pace từng người, rubric giám khảo. Các chỉ số này phải **chưa có dữ liệu**, không được tạo số giả.
3. Lịch sử/ảnh hưởng quyền đã có: mọi bổ sung cần giữ `associationDashboard`, BTC view-only, ADMIN refresh và phần không đăng nhập ẩn Dashboard.
4. Không kết luận đã đồng bộ lên EdgeOne chỉ vì có PR hoặc commit.

## Nâng cấp giai đoạn 1 — triển khai mã tại nhánh
- `topkey/executive-sport-insights.js` — thành phần **chỉ đọc** snapshot tính toán sẵn, 7 tab môn, tổng số giải/hồ sơ/trận/số dư và bảng giải gần đây.
- `topkey/executive-sport-insights.css` — màu navy/cyan TOPKEY, responsive, cuộn tab trên mobile, bảng có thể cuộn ngang.
- `topkey/index.html`, `topkey/executive-dashboard.js` — gắn trình hiển thị trước phần báo cáo cũ, không sửa tính điểm hay schema Firebase.
- `topkey/tests/executive-sport-insights.test.cjs` — kiểm tra wiring, 7 môn, không gọi Firebase/fetch, CSS responsive và cú pháp.
- Mã không ghi dữ liệu; không sử dụng tên/ví dụ giả lập trong báo cáo thật.
- Bản mô phỏng HTML ngoài production dùng số liệu DEMO, có 6 tab và screenshot desktop/mobile riêng.

## Giai đoạn 2 đề xuất (CHƯA TRIỂN KHAI)
1. Đọc/chuẩn hóa schema từng môn, xây adapters theo giải, filter theo tournamentId/category/date và đối tượng Viewer/Admin/BTC.
2. Thêm dữ liệu gốc có audit trail: football goals/assists/cards, badminton set scores, volleyball skill points, running finish time/splits, cooking score sheets, DIY gallery and scoring criteria.
3. Xây báo cáo chuẩn 16:9/PDF/XLSX riêng từng môn, đảm bảo tiêu đề kỳ thi, ngày snapshot, nguồn số liệu, trạng thái chính thức, chữ ký/duyệt; không suy ra kết quả thiếu.
4. Test quyền, nghiệm thu trên preview EdgeOne, kiểm tra báo cáo trên desktop/mobile và chỉ release sau Production Gate.

## Test và phát hành
- Source code: đã ghi vào nhánh GitHub cách ly; test static mới cần chạy trên checkout thực; không giả báo PASS.
- Preview UI riêng: HTML thử nghiệm mở được và render screenshot ở desktop/mobile; đây không phải EdgeOne Preview.
- Firebase live/emulator role matrix: **NOT TESTED**.
- EdgeOne Preview SHA + Browser E2E: **NOT TESTED**.
- Performance 3 cold/3 warm: **NOT TESTED**.
- Production release: **BLOCKED**. Không đổi Firebase Rules, không ghi dữ liệu, không dùng GitHub Actions.
