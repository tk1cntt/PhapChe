import toast from 'react-hot-toast';

function isBrowser() {
  return typeof window !== 'undefined';
}

/** Hiển thị toast thông báo thành công */
export function toastSuccess(message: string) {
  if (isBrowser()) toast.success(message);
}

/** Hiển thị toast thông báo lỗi */
export function toastError(message: string) {
  if (isBrowser()) toast.error(message);
}

/** Hiển thị toast thông báo thông tin */
export function toastInfo(message: string) {
  if (isBrowser()) toast(message);
}

/** Hiển thị toast thông báo cảnh báo */
export function toastWarning(message: string) {
  if (isBrowser()) toast(message, { icon: '⚠️' });
}
