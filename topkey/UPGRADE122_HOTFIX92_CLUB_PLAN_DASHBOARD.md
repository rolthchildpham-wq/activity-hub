# Upgrade122 Hotfix92 - Club Plan + Hub Report

## Mục tiêu
Đưa cấu trúc kế hoạch CLB từ workbook `2026-09-羽毛球社-社团活动计划书.xlsx` vào Sports Hub theo mô hình dùng chung cho tất cả CLB/môn.

## Mapping workbook

### Sheet 01 - 羽毛球社
Hiển thị trên Hub dưới thẻ **Lịch & kế hoạch CLB**:
- Thời gian hoạt động: 20/10/2026 - 20/11/2026.
- Địa điểm: 公司B4-2F.
- Quy mô dự kiến: khoảng 40 người.
- Hạn đăng ký: 17/10/2026.
- Vòng bảng: 20/10 - 15/11.
- Bán kết: 16/11 - 19/11.
- Chung kết: 20/11.
- Giữ nguyên mục tiêu, giới thiệu, đơn vị chủ trì/phối hợp và đầu mối trong workspace BTC.

### Sheet 02 - 預算
Thẻ **Hồ sơ kế hoạch CLB · BTC / Ngân sách**:
- Thu dự kiến: 15.000.000 VND.
- Chi dự kiến theo công thức workbook: 14.315.000 VND.
- Cân đối dự kiến: 685.000 VND.
- Có thể thêm/xóa/sửa dòng thu và chi; KPI Hub tự tính lại.

### Sheet 03 - 工作分配
Thẻ **Hồ sơ kế hoạch CLB · BTC / Phân công**:
- Công việc, người phụ trách, ngày bắt đầu, ngày dự kiến, ngày thực tế, ghi chú.
- Tự phân loại Hoàn tất / Quá hạn / Đang làm.
- Hub tổng hợp số việc hoàn tất và quá hạn.

## Mô hình dữ liệu
Mỗi môn lưu độc lập tại:
`<sport-root>/clubPlan`

ADMIN được xem/sửa tất cả. BTC chỉ đọc/ghi `clubPlan` đúng `sportScope`. Tài khoản lãnh đạo có quyền Executive Dashboard có thể xem lịch tổng hợp nhưng không thấy workspace chỉnh sửa BTC.

## Dashboard Hub
- Thẻ Lịch & kế hoạch CLB chỉ hiển thị CLB đã có dữ liệu thật.
- KPI tổng: thu dự kiến, chi dự kiến, cân đối, công việc hoàn tất, công việc quá hạn.
- Timeline theo mốc hoạt động.
- Giữ i18n Việt / Anh / Trung cho phần giao diện; dữ liệu gốc do BTC nhập không tự dịch.

## Backup
System Admin sport backup V2 bao gồm cả `tournaments` và `clubPlan`.

## Firebase Rules
Phải publish `firebase.database.rules.json` của H92 để BTC có thể lưu `clubPlan` theo đúng phạm vi môn.
