# Upgrade119 — Multi-sport Rule Engine integration

Nền: Upgrade118 Production Artifact Cleanup FULLTEST.

## Thay đổi chính
- Sửa routing Hub: Football / Volleyball / Running / Handmade / Shuttlecock / Cooking truyền đúng `?sport=`.
- Không thay đổi ứng dụng Badminton độc lập.
- Mỗi môn VNext dùng Firebase root riêng qua `T.SPORT.root`.
- Bổ sung profile đăng ký, nội dung, format và rule metadata theo từng môn.
- Volleyball: team roster, Nam/Nữ/Mix, round-robin / group+knockout / knockout, best-of-5 25 điểm + set quyết định 15.
- Football: đội Nam/Nữ theo sân 5/7/11, group/knockout metadata.
- Running: 3K/5K/10K/4x400, mass start/time trial/heats-final metadata.
- Handmade: rubric 30/30/20/20.
- Shuttlecock: đơn Nam/Nữ, đôi Nam/Nữ, đôi Nam-Nữ, đồng đội.
- Cooking: rubric 25/25/50.

## An toàn tương thích
- Không đổi Firebase project/Auth dùng chung.
- Không đổi root Badminton.
- Không migrate hoặc ghi đè dữ liệu cũ tự động.
- Upgrade119 là additive layer; engine VNext cũ vẫn là runtime chính.
