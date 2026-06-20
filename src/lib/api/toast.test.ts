import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toastError, toastSuccess, toastInfo } from '../toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    custom: vi.fn(),
  },
}));

describe('Toast Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toastError', () => {
    it('should call toast.error with error message', async () => {
      const toast = (await import('react-hot-toast')).default;
      toastError('Lỗi máy chủ');

      expect(toast.error).toHaveBeenCalledWith(
        'Lỗi máy chủ',
        expect.objectContaining({
          duration: 4000,
          position: 'top-right',
        })
      );
    });

    it('should use default error message when no message provided', async () => {
      const toast = (await import('react-hot-toast')).default;
      toastError();

      expect(toast.error).toHaveBeenCalledWith(
        'Đã xảy ra lỗi',
        expect.any(Object)
      );
    });
  });

  describe('toastSuccess', () => {
    it('should call toast.success with success message', async () => {
      const toast = (await import('react-hot-toast')).default;
      toastSuccess('Thao tác thành công');

      expect(toast.success).toHaveBeenCalledWith(
        'Thao tác thành công',
        expect.objectContaining({
          duration: 3000,
          position: 'top-right',
        })
      );
    });

    it('should use default success message when no message provided', async () => {
      const toast = (await import('react-hot-toast')).default;
      toastSuccess();

      expect(toast.success).toHaveBeenCalledWith(
        'Thành công',
        expect.any(Object)
      );
    });
  });

  describe('toastInfo', () => {
    it('should call toast.custom with info message', async () => {
      const toast = (await import('react-hot-toast')).default;
      toastInfo('Thông tin quan trọng');

      expect(toast.custom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          duration: 3000,
          position: 'top-right',
        })
      );
    });

    it('should use default info message when no message provided', async () => {
      const toast = (await import('react-hot-toast')).default;
      toastInfo();

      expect(toast.custom).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Object)
      );
    });
  });
});
