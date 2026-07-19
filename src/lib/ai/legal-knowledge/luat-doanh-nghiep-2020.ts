/**
 * Luật Doanh nghiệp 2020 (Law No. 59/2020/QH14)
 *
 * Các điều khoản quan trọng nhất cho dịch vụ pháp lý doanh nghiệp.
 * Domain: corporate-legal, commercial-legal
 */

import type { LegalKnowledgeDoc } from './types';

export const luatDoanhNghiep2020: LegalKnowledgeDoc = {
  id: 'luat-doanh-nghiep-2020',
  source: 'Luật Doanh nghiệp 2020 (Số 59/2020/QH14)',
  domainTags: ['corporate-legal', 'commercial-legal'],
  version: '2020',
  chapters: [
    {
      title: 'Chương I — Những quy định chung',
      articles: [
        {
          number: 'Điều 1',
          title: 'Phạm vi điều chỉnh',
          content: 'Luật này quy định về việc thành lập, tổ chức quản lý, tổ chức lại, giải thể và hoạt động có liên quan của doanh nghiệp, bao gồm công ty trách nhiệm hữu hạn, công ty cổ phần, công ty hợp danh và doanh nghiệp tư nhân; quy định về nhóm công ty.',
        },
        {
          number: 'Điều 2',
          title: 'Đối tượng áp dụng',
          content: '1. Doanh nghiệp. 2. Cơ quan, tổ chức, cá nhân có liên quan đến việc thành lập, tổ chức quản lý, tổ chức lại, giải thể và hoạt động của doanh nghiệp.',
        },
        {
          number: 'Điều 4',
          title: 'Giải thích từ ngữ',
          content: 'Doanh nghiệp là tổ chức có tên riêng, có tài sản, có trụ sở giao dịch, được thành lập hoặc đăng ký thành lập theo quy định của pháp luật nhằm mục đích kinh doanh. Doanh nghiệp nhà nước là doanh nghiệp do Nhà nước nắm giữ trên 50% vốn điều lệ, tổng số cổ phần có quyền biểu quyết. Doanh nghiệp Việt Nam là doanh nghiệp được thành lập hoặc đăng ký thành lập theo pháp luật Việt Nam và có trụ sở chính tại Việt Nam.',
        },
        {
          number: 'Điều 6',
          title: 'Quyền thành lập, góp vốn, mua cổ phần, mua phần vốn góp và quản lý doanh nghiệp',
          content: 'Tổ chức, cá nhân có quyền thành lập và quản lý doanh nghiệp tại Việt Nam theo quy định của Luật này, trừ trường hợp quy định tại khoản 2 Điều này.',
        },
        {
          number: 'Điều 7',
          title: 'Quyền của doanh nghiệp',
          content: '1. Tự do kinh doanh ngành, nghề mà luật không cấm. 2. Tự chủ kinh doanh và lựa chọn hình thức, phương thức huy động, phân bổ và sử dụng vốn. 3. Tự chủ quyết định việc tuyển dụng, thuê và sử dụng lao động theo quy định của pháp luật về lao động.',
        },
        {
          number: 'Điều 8',
          title: 'Nghĩa vụ của doanh nghiệp',
          content: '1. Đáp ứng đủ điều kiện đầu tư kinh doanh khi kinh doanh ngành, nghề đầu tư kinh doanh có điều kiện. 2. Tổ chức công tác kế toán, lập và nộp báo cáo tài chính trung thực, chính xác, đúng thời hạn. 3. Kê khai thuế, nộp thuế và thực hiện các nghĩa vụ tài chính khác. 4. Bảo đảm quyền và lợi ích hợp pháp của người lao động.',
        },
      ],
    },
    {
      title: 'Chương II — Thành lập doanh nghiệp',
      articles: [
        {
          number: 'Điều 17',
          title: 'Hồ sơ đăng ký doanh nghiệp tư nhân',
          content: '1. Giấy đề nghị đăng ký doanh nghiệp. 2. Bản sao giấy tờ pháp lý của cá nhân đối với chủ doanh nghiệp tư nhân.',
        },
        {
          number: 'Điều 19',
          title: 'Hồ sơ đăng ký công ty TNHH một thành viên',
          content: '1. Giấy đề nghị đăng ký doanh nghiệp. 2. Điều lệ công ty. 3. Bản sao giấy tờ pháp lý của cá nhân đối với chủ sở hữu công ty. 4. Danh sách người đại diện theo ủy quyền và bản sao giấy tờ pháp lý.',
        },
        {
          number: 'Điều 21',
          title: 'Hồ sơ đăng ký công ty TNHH hai thành viên trở lên',
          content: '1. Giấy đề nghị đăng ký doanh nghiệp. 2. Điều lệ công ty. 3. Danh sách thành viên. 4. Bản sao giấy tờ pháp lý của cá nhân đối với thành viên. 5. Bản sao Giấy chứng nhận đăng ký đầu tư đối với nhà đầu tư nước ngoài.',
        },
        {
          number: 'Điều 23',
          title: 'Hồ sơ đăng ký công ty cổ phần',
          content: '1. Giấy đề nghị đăng ký doanh nghiệp. 2. Điều lệ công ty. 3. Danh sách cổ đông sáng lập và cổ đông là nhà đầu tư nước ngoài. 4. Bản sao giấy tờ pháp lý của cổ đông sáng lập. 5. Bản sao Giấy chứng nhận đăng ký đầu tư.',
        },
        {
          number: 'Điều 27',
          title: 'Cấp Giấy chứng nhận đăng ký doanh nghiệp',
          content: 'Doanh nghiệp được cấp Giấy chứng nhận đăng ký doanh nghiệp khi có đủ các điều kiện: a) Ngành, nghề đăng ký kinh doanh không bị cấm đầu tư kinh doanh; b) Tên của doanh nghiệp được đặt theo đúng quy định; c) Có hồ sơ đăng ký doanh nghiệp hợp lệ; d) Nộp đủ lệ phí đăng ký doanh nghiệp. Thời hạn cấp: 03 ngày làm việc kể từ ngày nhận được hồ sơ hợp lệ.',
        },
        {
          number: 'Điều 31',
          title: 'Thông báo thay đổi nội dung đăng ký doanh nghiệp',
          content: 'Doanh nghiệp phải thông báo với Cơ quan đăng ký kinh doanh khi thay đổi một trong các nội dung: tên doanh nghiệp, địa chỉ trụ sở chính, ngành nghề kinh doanh, vốn điều lệ, thông tin người đại diện theo pháp luật. Thời hạn thông báo: 10 ngày kể từ ngày quyết định thay đổi.',
        },
      ],
    },
    {
      title: 'Chương III — Công ty TNHH',
      articles: [
        {
          number: 'Điều 46',
          title: 'Công ty TNHH một thành viên',
          content: 'Công ty trách nhiệm hữu hạn một thành viên là doanh nghiệp do một tổ chức hoặc một cá nhân làm chủ sở hữu. Chủ sở hữu công ty chịu trách nhiệm về các khoản nợ và nghĩa vụ tài sản khác của công ty trong phạm vi số vốn điều lệ của công ty.',
        },
        {
          number: 'Điều 47',
          title: 'Công ty TNHH hai thành viên trở lên',
          content: 'Công ty trách nhiệm hữu hạn hai thành viên trở lên là doanh nghiệp có từ 02 đến 50 thành viên là tổ chức, cá nhân. Thành viên chịu trách nhiệm về các khoản nợ và nghĩa vụ tài sản khác trong phạm vi số vốn đã góp. Phần vốn góp của thành viên chỉ được chuyển nhượng theo quy định tại Điều 52.',
        },
        {
          number: 'Điều 50',
          title: 'Hội đồng thành viên',
          content: 'Hội đồng thành viên gồm tất cả thành viên công ty, là cơ quan quyết định cao nhất của công ty. Hội đồng thành viên họp ít nhất mỗi năm một lần. Cuộc họp Hội đồng thành viên được tiến hành khi có số thành viên dự họp đại diện ít nhất 65% vốn điều lệ.',
        },
        {
          number: 'Điều 52',
          title: 'Chuyển nhượng phần vốn góp',
          content: 'Thành viên có quyền chuyển nhượng một phần hoặc toàn bộ phần vốn góp của mình cho người khác. Phải chào bán phần vốn đó cho các thành viên còn lại theo tỷ lệ tương ứng trước khi chào bán cho người không phải là thành viên. Thời hạn chào bán: 30 ngày kể từ ngày chào bán.',
        },
      ],
    },
    {
      title: 'Chương V — Công ty cổ phần',
      articles: [
        {
          number: 'Điều 111',
          title: 'Công ty cổ phần',
          content: 'Công ty cổ phần là doanh nghiệp có vốn điều lệ được chia thành nhiều phần bằng nhau gọi là cổ phần. Cổ đông có thể là tổ chức, cá nhân; số lượng cổ đông tối thiểu là 03 và không hạn chế số lượng tối đa. Cổ đông chỉ chịu trách nhiệm về các khoản nợ và nghĩa vụ tài sản khác trong phạm vi số vốn đã góp.',
        },
        {
          number: 'Điều 112',
          title: 'Các loại cổ phần',
          content: 'Công ty cổ phần phải có cổ phần phổ thông. Người sở hữu cổ phần phổ thông là cổ đông phổ thông. Ngoài ra có thể có cổ phần ưu đãi: ưu đãi cổ tức, ưu đãi hoàn lại, ưu đãi biểu quyết. Cổ phần ưu đãi biểu quyết chỉ do tổ chức được Chính phủ ủy quyền và cổ đông sáng lập nắm giữ, có hiệu lực trong 03 năm.',
        },
        {
          number: 'Điều 115',
          title: 'Quyền của cổ đông phổ thông',
          content: 'Cổ đông phổ thông có quyền: tham dự và phát biểu trong các cuộc họp Đại hội đồng cổ đông; biểu quyết trực tiếp hoặc thông qua đại diện; nhận cổ tức; ưu tiên mua cổ phần mới; tiếp cận các tài liệu của công ty.',
        },
        {
          number: 'Điều 135',
          title: 'Đại hội đồng cổ đông',
          content: 'Đại hội đồng cổ đông là cơ quan quyết định cao nhất của công ty cổ phần, gồm tất cả cổ đông có quyền biểu quyết. Họp thường niên mỗi năm một lần trong thời hạn 04 tháng kể từ ngày kết thúc năm tài chính. Cuộc họp được tiến hành khi có số cổ đông dự họp đại diện trên 50% tổng số phiếu biểu quyết.',
        },
        {
          number: 'Điều 137',
          title: 'Hội đồng quản trị',
          content: 'Hội đồng quản trị là cơ quan quản lý công ty, có toàn quyền nhân danh công ty để quyết định các vấn đề liên quan đến mục đích, quyền lợi của công ty. Hội đồng quản trị có từ 03 đến 11 thành viên, nhiệm kỳ không quá 05 năm.',
        },
        {
          number: 'Điều 148',
          title: 'Điều kiện trở thành thành viên HĐQT',
          content: 'Thành viên Hội đồng quản trị phải có đủ năng lực hành vi dân sự, không thuộc đối tượng bị cấm quản lý doanh nghiệp, có trình độ chuyên môn và kinh nghiệm trong quản trị kinh doanh. Thành viên độc lập phải đáp ứng thêm các điều kiện riêng.',
        },
      ],
    },
    {
      title: 'Chương VIII — Giải thể doanh nghiệp',
      articles: [
        {
          number: 'Điều 207',
          title: 'Các trường hợp giải thể doanh nghiệp',
          content: '1. Kết thúc thời hạn hoạt động đã ghi trong Điều lệ công ty. 2. Theo quyết định của chủ doanh nghiệp. 3. Công ty không còn đủ số lượng thành viên tối thiểu trong 06 tháng liên tục. 4. Bị thu hồi Giấy chứng nhận đăng ký doanh nghiệp.',
        },
        {
          number: 'Điều 208',
          title: 'Thủ tục giải thể doanh nghiệp',
          content: '1. Thông qua quyết định giải thể. 2. Thanh lý tài sản và thanh toán các khoản nợ. 3. Thông báo cho Cơ quan đăng ký kinh doanh trong 07 ngày làm việc. 4. Nộp hồ sơ giải thể trong 05 ngày làm việc sau khi thanh toán hết nợ. Thời gian giải thể không quá 180 ngày.',
        },
      ],
    },
    {
      title: 'Chương IX — Nhóm công ty',
      articles: [
        {
          number: 'Điều 195',
          title: 'Công ty mẹ — công ty con',
          content: 'Một công ty được coi là công ty mẹ của công ty khác nếu thuộc một trong các trường hợp: sở hữu trên 50% vốn điều lệ hoặc tổng số cổ phần phổ thông; có quyền trực tiếp hoặc gián tiếp bổ nhiệm đa số hoặc tất cả thành viên HĐQT, Giám đốc; có quyền quyết định việc sửa đổi, bổ sung Điều lệ.',
        },
      ],
    },
  ],
};
