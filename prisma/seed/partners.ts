import { Prisma } from '@prisma/client';

const partnerData = [
  { name: 'Công ty Luật Baker McKenzie Vietnam', slug: 'baker-mckenzie-vn', type: 'law_firm', contactEmail: 'hcmc@bakermckenzie.com', phone: '+84-28-3822-3000', address: 'Tầng 12, Saigon Centre, 67 Lê Lợi, Quận 1, TP.HCM' },
  { name: 'Văn phòng Luật sư Russin & Vecchi', slug: 'russin-vecchi', type: 'law_firm', contactEmail: 'hcmc@russinvecchi.com', phone: '+84-28-3823-8500', address: 'Tầng 10, Saigon Tower, 29 Lê Duẩn, Quận 1, TP.HCM' },
  { name: 'Công ty Luật TNHH LNT & Thành viên', slug: 'lnt-partners', type: 'law_firm', contactEmail: 'info@lntpartners.com', phone: '+84-28-3827-7200', address: 'Tầng 15, Bitexco Financial Tower, 2 Hải Triều, Quận 1, TP.HCM' },
  { name: 'Văn phòng Luật sư Phnom Penh & Partners', slug: 'pp-partners', type: 'law_firm', contactEmail: 'contact@pppartners.com', phone: '+84-28-3939-3333', address: 'Tầng 8, Pearl Plaza, 561A Điện Biên Phủ, Bình Thạnh, TP.HCM' },
  { name: 'Công ty Luật Tilleke & Gibbins Vietnam', slug: 'tilleke-gibbins-vn', type: 'law_firm', contactEmail: 'vietnam@tilleke.com', phone: '+84-28-3936-9999', address: 'Tầng 7, Kumho Asiana Plaza, 39 Lê Duẩn, Quận 1, TP.HCM' },
];

const seedServiceTypes = [
  { key: 'labor_contract', name: 'Hợp đồng Lao động', description: 'Tư vấn và soạn thảo hợp đồng lao động' },
  { key: 'trademark_registration', name: 'Đăng ký Nhãn hiệu', description: 'Hỗ trợ đăng ký bảo hộ nhãn hiệu' },
  { key: 'company_formation', name: 'Thành lập Doanh nghiệp', description: 'Tư vấn và thực hiện thủ tục thành lập công ty' },
  { key: 'compliance_review', name: 'Rà soát Tuân thủ', description: 'Đánh giá tuân thủ pháp lý cho doanh nghiệp' },
  { key: 'contract_negotiation', name: 'Đàm phán Hợp đồng', description: 'Hỗ trợ đàm phán và hoàn thiện hợp đồng' },
];

export default async function seedPartners(tx: Prisma.TransactionClient) {
  console.log('Seeding partner data...');

  // Create partners
  const partnerIds: string[] = [];
  for (const p of partnerData) {
    const partner = await tx.partner.create({
      data: {
        name: p.name,
        slug: p.slug,
        type: p.type,
        contactEmail: p.contactEmail,
        phone: p.phone,
        address: p.address,
        status: 'active',
      },
    });
    partnerIds.push(partner.id);
  }
  console.log('  ✓ Partners:', partnerIds.length);

  // Create service types
  const stIds: string[] = [];
  for (const st of seedServiceTypes) {
    const serviceType = await tx.serviceType.create({
      data: {
        key: st.key,
        name: st.name,
        description: st.description,
        isActive: true,
      },
    });
    stIds.push(serviceType.id);
  }
  console.log('  ✓ Service types:', stIds.length);

  return {
    partnerIds,
    serviceTypeIds: stIds,
    counts: {
      partners: partnerIds.length,
      serviceTypes: stIds.length,
    },
  };
}
