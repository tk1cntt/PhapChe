import toast from 'react-hot-toast';

/** Hiển thị toast thông báo thành công */
export function toastSuccess(message: string) {
  if (typeof window !== 'undefined') toast.success(message);
}

/** Hiển thị toast thông báo lỗi */
export function toastError(message: string) {
  if (typeof window !== 'undefined') toast.error(message);
}

/** Hiển thị toast thông báo thông tin */
export function toastInfo(message: string) {
  if (typeof window !== 'undefined') toast(message);
}

/** Hiển thị toast thông báo cảnh báo */
export function toastWarning(message: string) {
  if (typeof window !== 'undefined') toast(message, { icon: '⚠️' });
}
