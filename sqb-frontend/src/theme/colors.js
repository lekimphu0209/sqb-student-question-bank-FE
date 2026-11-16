// Tất cả mã màu của ứng dụng đặt tại đây (yêu cầu phi chức năng: không dùng tên màu, lưu tập trung 1 file)
// 2 theme: light (mặc định) + dark. lib/theme.ts đọc file này để gán CSS vars --sqb-* lúc runtime.
export const themes = {
  light: {
    primary: '#1877F2',
    primaryHover: '#166FE5',
    bg: '#F0F2F5',
    surface: '#FFFFFF',
    text: '#050505',
    textMuted: '#65676B',
    border: '#CED0D4',
    danger: '#E41E3F',
    success: '#31A24C',
    like: '#1877F2',
  },
  dark: {
    primary: '#2374E1',
    primaryHover: '#3982EC',
    bg: '#18191A',
    surface: '#242526',
    text: '#E4E6EB',
    textMuted: '#B0B3B8',
    border: '#3E4042',
    danger: '#F35369',
    success: '#45BD62',
    like: '#5890FF',
  },
}

// Giữ export cũ để tương thích
export const colors = themes.light
