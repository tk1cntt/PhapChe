import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toastSuccess, toastError, toastInfo, toastWarning } from './toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Toast Wrapper', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('toastSuccess calls toast.success with message', async () => {
    const toast = (await import('react-hot-toast')).default;
    toastSuccess('Thành công');
    expect(toast.success).toHaveBeenCalledWith('Thành công');
  });

  it('toastError calls toast.error with message', async () => {
    const toast = (await import('react-hot-toast')).default;
    toastError('Lỗi xảy ra');
    expect(toast.error).toHaveBeenCalledWith('Lỗi xảy ra');
  });

  it('toastInfo calls toast with message', async () => {
    const toast = (await import('react-hot-toast')).default;
    toastInfo('Thông tin');
    expect(toast).toHaveBeenCalledWith('Thông tin');
  });

  it('toastWarning calls toast with message and warning icon', async () => {
    const toast = (await import('react-hot-toast')).default;
    toastWarning('Cảnh báo');
    expect(toast).toHaveBeenCalledWith('Cảnh báo', { icon: '⚠️' });
  });

  it('all toast functions are defined', () => {
    expect(typeof toastSuccess).toBe('function');
    expect(typeof toastError).toBe('function');
    expect(typeof toastInfo).toBe('function');
    expect(typeof toastWarning).toBe('function');
  });
});
