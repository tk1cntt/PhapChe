'use client';

import ServiceCard, { ServiceOption } from './ServiceCard';

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'agent-contract',
    title: 'Soan hop dong dai ly',
    description: 'Chuan hoa thong tin doi tac, chiet khau, dieu khoan thanh toan, thoi han hop dong va pham vi phan phoi.',
    tags: [
      { label: 'Khuyen nghi', variant: 'green' },
    ],
    estimatedTime: '2-3 ngay',
  },
  {
    id: 'labor-contract',
    title: 'Soan hop dong lao dong',
    description: 'Ghi nhan vi tri, luong, thoi han, dieu kien lam viec, bao mat thong tin va dieu khoan cham dut.',
    tags: [
      { label: 'Nhanh', variant: 'blue' },
    ],
  },
  {
    id: 'trademark',
    title: 'Dang ky nhan hieu',
    description: 'Thu thap ten nhan hieu, nhom san pham/dich vu, chu so huu, mau nhan va pham vi dang ky.',
    tags: [
      { label: 'IP', variant: 'purple' },
    ],
  },
  {
    id: 'nda',
    title: 'Ra soat hop dong / NDA',
    description: 'Chuyen vien kiem tra rui ro phap ly, dieu khoan bat loi, nghia vu thanh toan, bao mat va trai nhiem boi thuong.',
    tags: [
      { label: 'Can tai lieu', variant: 'orange' },
    ],
  },
  {
    id: 'other',
    title: 'Dich vu khac / chua ro loai viec',
    description: 'Ho so se duoc chuyen de chuyen vien phan loai truoc khi xu ly chinh thuc.',
    tags: [
      { label: 'Phan loai', variant: 'red' },
    ],
  },
];

interface ServiceTypeSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ServiceTypeSelector({ selectedId, onSelect }: ServiceTypeSelectorProps) {
  return (
    <div className="space-y-4">
      {SERVICE_OPTIONS.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          selected={service.id === selectedId}
          onSelect={() => onSelect(service.id)}
        />
      ))}
    </div>
  );
}
