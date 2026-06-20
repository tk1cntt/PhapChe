/**
 * Task 76-17: Unit tests cho FileUploadZone component
 * Test coverage: render, drag-drop, file list, remove, validation
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileUploadZone from '../FileUploadZone';
import type { UploadedFile } from '@/lib/types/wizard';

// Mock window.confirm
const mockConfirm = vi.fn().mockReturnValue(true);
window.confirm = mockConfirm;

describe('FileUploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Whitebox tests
  describe('rendering', () => {
    it('renders upload zone với heading và description', () => {
      render(
        <FileUploadZone files={[]} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );
      expect(screen.getByText('Tài liệu đính kèm')).toBeInTheDocument();
      expect(screen.getByText(/Tải lên các tài liệu liên quan/)).toBeInTheDocument();
    });

    it('renders empty state message', () => {
      render(
        <FileUploadZone files={[]} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );
      expect(screen.getByText('Chưa có file nào được tải lên')).toBeInTheDocument();
    });

    it('renders uploaded files list', () => {
      const files: UploadedFile[] = [
        { vaultFileId: 'f1', filename: 'contract.pdf', size: 1024 },
        { vaultFileId: 'f2', filename: 'evidence.jpg', size: 2048 * 1024 },
      ];
      render(
        <FileUploadZone files={files} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );
      expect(screen.getByText('contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('evidence.jpg')).toBeInTheDocument();
    });

    it('formats file size correctly', () => {
      const files: UploadedFile[] = [
        { vaultFileId: 'f1', filename: 'small.pdf', size: 512 },
        { vaultFileId: 'f2', filename: 'medium.pdf', size: 5 * 1024 },
        { vaultFileId: 'f3', filename: 'large.pdf', size: 3 * 1024 * 1024 },
      ];
      render(
        <FileUploadZone files={files} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );
      expect(screen.getByText('512 B')).toBeInTheDocument();
      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
      expect(screen.getByText('3.0 MB')).toBeInTheDocument();
    });

    it('renders file count header', () => {
      const files: UploadedFile[] = [
        { vaultFileId: 'f1', filename: 'a.pdf', size: 1024 },
        { vaultFileId: 'f2', filename: 'b.pdf', size: 1024 },
      ];
      render(
        <FileUploadZone files={files} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );
      expect(screen.getByText('2 file đã tải lên')).toBeInTheDocument();
    });
  });

  // Blackbox tests
  describe('interaction', () => {
    it('removes file when X button clicked and confirmed', () => {
      const onFileRemove = vi.fn();
      const files: UploadedFile[] = [
        { vaultFileId: 'f1', filename: 'contract.pdf', size: 1024 },
      ];
      render(
        <FileUploadZone files={files} onFileAdd={vi.fn()} onFileRemove={onFileRemove} />
      );

      const removeBtn = screen.getByLabelText('Xóa file');
      fireEvent.click(removeBtn);

      expect(mockConfirm).toHaveBeenCalledWith('Xóa file này?');
      expect(onFileRemove).toHaveBeenCalledWith('f1');
    });

    it('does not remove file when cancel is clicked', () => {
      mockConfirm.mockReturnValueOnce(false);
      const onFileRemove = vi.fn();
      const files: UploadedFile[] = [
        { vaultFileId: 'f1', filename: 'contract.pdf', size: 1024 },
      ];
      render(
        <FileUploadZone files={files} onFileAdd={vi.fn()} onFileRemove={onFileRemove} />
      );

      const removeBtn = screen.getByLabelText('Xóa file');
      fireEvent.click(removeBtn);

      expect(onFileRemove).not.toHaveBeenCalled();
    });

    it('drag enter shows active state', () => {
      render(
        <FileUploadZone files={[]} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );

      const dropZone = screen.getByText(/Kéo thả file/).closest('div')!;
      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).toHaveClass('border-blue-500');
    });

    it('drag leave removes active state', () => {
      render(
        <FileUploadZone files={[]} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );

      const dropZone = screen.getByText(/Kéo thả file/).closest('div')!;
      fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });
      fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });

      expect(dropZone).not.toHaveClass('border-blue-500');
    });
  });

  // Error tests
  describe('error handling', () => {
    it('renders error message when file exceeds size limit', async () => {
      render(
        <FileUploadZone files={[]} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );

      // Upload a file that exceeds size limit
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = new File(['x'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 60 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText('File vượt quá 50MB')).toBeInTheDocument();
      });
    });

    it('rejects unsupported file types', async () => {
      render(
        <FileUploadZone files={[]} onFileAdd={vi.fn()} onFileRemove={vi.fn()} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const unsupportedFile = new File(['x'], 'test.exe', { type: 'application/x-msdownload' });

      fireEvent.change(fileInput, { target: { files: [unsupportedFile] } });

      await waitFor(() => {
        expect(screen.getByText('Loại file không được hỗ trợ')).toBeInTheDocument();
      });
    });
  });

  // Regression: real-world bugs đã gặp
  describe('regression — no server call in wizard', () => {
    it('does NOT make HTTP request when adding file (wizard has no requestId)', async () => {
      // Bug: FileUploadZone gọi POST /api/intake/attach-file mà không có requestId
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const onFileAdd = vi.fn();

      render(
        <FileUploadZone files={[]} onFileAdd={onFileAdd} onFileRemove={vi.fn()} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // Wait for simulated progress to complete
      await waitFor(() => {
        expect(onFileAdd).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Không được gọi fetch/XHR đến server
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('adds file with generated temp vaultFileId (not from server response)', async () => {
      const onFileAdd = vi.fn();

      render(
        <FileUploadZone files={[]} onFileAdd={onFileAdd} onFileRemove={vi.fn()} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'contract.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(onFileAdd).toHaveBeenCalled();
      }, { timeout: 3000 });

      const addedFile = onFileAdd.mock.calls[0][0];
      // vaultFileId phải là temp ID (bắt đầu bằng wip-)
      expect(addedFile.vaultFileId).toMatch(/^wip-/);
      expect(addedFile.filename).toBe('contract.pdf');
      expect(addedFile.size).toBe(7); // 'content' = 7 bytes
    });

    it('accepts valid file with known extension even if MIME type is empty', async () => {
      // Edge case: một số browser/os gửi MIME type rỗng
      const onFileAdd = vi.fn();

      render(
        <FileUploadZone files={[]} onFileAdd={onFileAdd} onFileRemove={vi.fn()} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      // File có extension .pdf nhưng MIME type rỗng
      const oddFile = new File(['pdfcontent'], 'important.pdf', { type: '' });

      fireEvent.change(fileInput, { target: { files: [oddFile] } });

      await waitFor(() => {
        expect(onFileAdd).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(onFileAdd).toHaveBeenCalled();
    });

    it('adds multiple files when multiple are selected', async () => {
      const onFileAdd = vi.fn();

      render(
        <FileUploadZone files={[]} onFileAdd={onFileAdd} onFileRemove={vi.fn()} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = new File(['a'], 'a.pdf', { type: 'application/pdf' });
      const file2 = new File(['bb'], 'b.jpg', { type: 'image/jpeg' });
      const file3 = new File(['ccc'], 'c.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });

      await waitFor(() => {
        expect(onFileAdd).toHaveBeenCalledTimes(3);
      }, { timeout: 5000 });
    });
  });
});
