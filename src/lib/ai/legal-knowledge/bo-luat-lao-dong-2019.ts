/**
 * Bộ luật Lao động 2019 (Law No. 45/2019/QH14)
 *
 * Các điều khoản quan trọng nhất cho dịch vụ pháp lý lao động.
 * Domain: employment-legal
 */

import type { LegalKnowledgeDoc } from './types';

export const boLuatLaoDong2019: LegalKnowledgeDoc = {
  id: 'bo-luat-lao-dong-2019',
  source: 'Bộ luật Lao động 2019 (Số 45/2019/QH14)',
  domainTags: ['employment-legal'],
  version: '2019',
  chapters: [
    {
      title: 'Chương I — Những quy định chung',
      articles: [
        {
          number: 'Điều 2',
          title: 'Đối tượng áp dụng',
          content: '1. Người lao động làm việc theo hợp đồng lao động. 2. Người sử dụng lao động là doanh nghiệp, cơ quan, tổ chức, hợp tác xã, hộ gia đình và cá nhân có thuê mướn, sử dụng lao động. 3. Các cơ quan, tổ chức, cá nhân khác có liên quan đến quan hệ lao động.',
        },
        {
          number: 'Điều 3',
          title: 'Giải thích từ ngữ',
          content: 'Người lao động là người làm việc cho người sử dụng lao động theo thỏa thuận, được trả lương và chịu sự quản lý, điều hành, giám sát của người sử dụng lao động. Người sử dụng lao động là doanh nghiệp, cơ quan, tổ chức, hợp tác xã, hộ gia đình, cá nhân có thuê mướn, sử dụng người lao động làm việc cho mình theo thỏa thuận.',
        },
        {
          number: 'Điều 4',
          title: 'Chính sách của Nhà nước về lao động',
          content: 'Nhà nước bảo đảm quyền và lợi ích hợp pháp của người lao động, người sử dụng lao động; khuyến khích những thỏa thuận bảo đảm cho người lao động có điều kiện thuận lợi hơn so với quy định của pháp luật lao động.',
        },
        {
          number: 'Điều 5',
          title: 'Quyền và nghĩa vụ của người lao động',
          content: 'Người lao động có quyền: làm việc; tự do lựa chọn việc làm, nơi làm việc; được hưởng lương phù hợp với trình độ, kỹ năng nghề; được làm việc trong điều kiện bảo đảm an toàn, vệ sinh lao động; đơn phương chấm dứt hợp đồng lao động; đình công.',
        },
        {
          number: 'Điều 6',
          title: 'Quyền và nghĩa vụ của người sử dụng lao động',
          content: 'Người sử dụng lao động có quyền: tuyển dụng, bố trí, quản lý, điều hành, giám sát lao động; khen thưởng và xử lý vi phạm kỷ luật lao động; đơn phương chấm dứt hợp đồng lao động; đóng cửa tạm thời nơi làm việc.',
        },
      ],
    },
    {
      title: 'Chương III — Hợp đồng lao động',
      articles: [
        {
          number: 'Điều 13',
          title: 'Hợp đồng lao động',
          content: 'Hợp đồng lao động là sự thỏa thuận giữa người lao động và người sử dụng lao động về việc làm có trả công, tiền lương, điều kiện lao động, quyền và nghĩa vụ của mỗi bên trong quan hệ lao động. Hợp đồng lao động phải được giao kết bằng văn bản, trừ trường hợp hợp đồng lao động dưới 01 tháng có thể giao kết bằng lời nói.',
        },
        {
          number: 'Điều 14',
          title: 'Nguyên tắc giao kết hợp đồng lao động',
          content: '1. Tự nguyện, bình đẳng, thiện chí, hợp tác và trung thực. 2. Tự do giao kết hợp đồng lao động nhưng không được trái pháp luật, thỏa ước lao động tập thể và đạo đức xã hội.',
        },
        {
          number: 'Điều 15',
          title: 'Nội dung hợp đồng lao động',
          content: 'Hợp đồng lao động phải có những nội dung chủ yếu: a) Tên, địa chỉ của người sử dụng lao động và họ tên của người đại diện; b) Họ tên, ngày tháng năm sinh, giới tính, địa chỉ nơi cư trú của người lao động; c) Công việc và địa điểm làm việc; d) Thời hạn của hợp đồng; đ) Mức lương, hình thức trả lương, thời hạn trả lương; e) Chế độ nâng bậc, nâng lương; g) Thời giờ làm việc, thời giờ nghỉ ngơi; h) Trang bị bảo hộ lao động; i) Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp; k) Đào tạo, bồi dưỡng, nâng cao trình độ.',
        },
        {
          number: 'Điều 20',
          title: 'Các loại hợp đồng lao động',
          content: '1. Hợp đồng lao động không xác định thời hạn: hai bên không xác định thời hạn, thời điểm chấm dứt hiệu lực. 2. Hợp đồng lao động xác định thời hạn: hai bên xác định thời hạn, thời điểm chấm dứt hiệu lực trong thời gian không quá 36 tháng kể từ thời điểm có hiệu lực.',
        },
        {
          number: 'Điều 25',
          title: 'Thời gian thử việc',
          content: 'Thời gian thử việc do hai bên thỏa thuận căn cứ vào tính chất và mức độ phức tạp của công việc nhưng chỉ được thử việc một lần đối với một công việc và bảo đảm: không quá 180 ngày đối với công việc của người quản lý doanh nghiệp; không quá 60 ngày đối với công việc có chức danh nghề cần trình độ từ cao đẳng trở lên; không quá 30 ngày đối với công việc có chức danh nghề cần trình độ trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ; không quá 06 ngày làm việc đối với công việc khác.',
        },
        {
          number: 'Điều 27',
          title: 'Tiền lương thử việc',
          content: 'Tiền lương của người lao động trong thời gian thử việc do hai bên thỏa thuận nhưng ít nhất phải bằng 85% mức lương của công việc đó.',
        },
        {
          number: 'Điều 34',
          title: 'Quyền đơn phương chấm dứt hợp đồng của người lao động',
          content: 'Người lao động có quyền đơn phương chấm dứt hợp đồng lao động không cần lý do nhưng phải báo trước: ít nhất 45 ngày nếu làm việc theo hợp đồng lao động không xác định thời hạn; ít nhất 30 ngày nếu làm việc theo hợp đồng lao động xác định thời hạn từ 12 đến 36 tháng; ít nhất 03 ngày làm việc nếu làm việc theo hợp đồng lao động xác định thời hạn dưới 12 tháng.',
        },
        {
          number: 'Điều 36',
          title: 'Quyền đơn phương chấm dứt hợp đồng của người sử dụng lao động',
          content: 'Người sử dụng lao động có quyền đơn phương chấm dứt hợp đồng lao động trong các trường hợp: a) Người lao động thường xuyên không hoàn thành công việc; b) Người lao động bị ốm đau, tai nạn đã điều trị 12 tháng liên tục đối với hợp đồng không xác định thời hạn, 06 tháng đối với hợp đồng xác định thời hạn mà khả năng lao động chưa hồi phục; c) Do thiên tai, hỏa hoạn, dịch bệnh nguy hiểm, địch họa; d) Người lao động không có mặt tại nơi làm việc sau thời hạn quy định; đ) Thay đổi cơ cấu, công nghệ hoặc sáp nhập, hợp nhất, chia, tách doanh nghiệp dẫn đến dôi dư lao động. Người sử dụng lao động phải báo trước ít nhất 45 ngày (hợp đồng không xác định thời hạn), 30 ngày (hợp đồng xác định thời hạn 12-36 tháng), 03 ngày làm việc (hợp đồng dưới 12 tháng).',
        },
      ],
    },
    {
      title: 'Chương VI — Tiền lương',
      articles: [
        {
          number: 'Điều 90',
          title: 'Tiền lương',
          content: 'Tiền lương là số tiền mà người sử dụng lao động trả cho người lao động theo thỏa thuận để thực hiện công việc, bao gồm mức lương theo công việc hoặc chức danh, phụ cấp lương và các khoản bổ sung khác. Mức lương của người lao động không được thấp hơn mức lương tối thiểu do Chính phủ quy định.',
        },
        {
          number: 'Điều 91',
          title: 'Mức lương tối thiểu',
          content: 'Mức lương tối thiểu là mức lương thấp nhất được trả cho người lao động làm công việc giản đơn nhất trong điều kiện lao động bình thường nhằm bảo đảm mức sống tối thiểu của người lao động và gia đình họ. Mức lương tối thiểu được xác lập theo vùng, công bố công khai và được điều chỉnh trên cơ sở mức sống tối thiểu và tình hình kinh tế - xã hội.',
        },
        {
          number: 'Điều 97',
          title: 'Kỳ hạn trả lương',
          content: 'Người lao động hưởng lương theo giờ, ngày, tuần được trả lương sau giờ, ngày, tuần làm việc. Người lao động hưởng lương theo tháng được trả lương tháng một lần hoặc nửa tháng một lần. Người lao động hưởng lương theo sản phẩm, theo khoán được trả lương theo thỏa thuận của hai bên.',
        },
      ],
    },
    {
      title: 'Chương VII — Thời giờ làm việc, thời giờ nghỉ ngơi',
      articles: [
        {
          number: 'Điều 105',
          title: 'Thời giờ làm việc bình thường',
          content: 'Thời giờ làm việc bình thường không quá 08 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần. Người sử dụng lao động có quyền quy định thời giờ làm việc theo ngày hoặc tuần nhưng phải thông báo cho người lao động biết.',
        },
        {
          number: 'Điều 107',
          title: 'Làm thêm giờ',
          content: 'Thời gian làm thêm giờ là khoảng thời gian làm việc ngoài thời giờ làm việc bình thường. Người sử dụng lao động được sử dụng người lao động làm thêm giờ khi đáp ứng đủ các điều kiện: được sự đồng ý của người lao động; bảo đảm số giờ làm thêm không quá 50% số giờ làm việc bình thường trong 01 ngày; không quá 40 giờ trong 01 tháng; không quá 200 giờ trong 01 năm.',
        },
        {
          number: 'Điều 113',
          title: 'Nghỉ hằng năm',
          content: 'Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động thì được nghỉ hằng năm, hưởng nguyên lương: 12 ngày làm việc đối với người làm công việc trong điều kiện bình thường; 14 ngày đối với người lao động chưa thành niên, lao động là người khuyết tật, người làm nghề, công việc nặng nhọc, độc hại, nguy hiểm; 16 ngày đối với người làm nghề, công việc đặc biệt nặng nhọc, độc hại, nguy hiểm.',
        },
        {
          number: 'Điều 115',
          title: 'Nghỉ lễ, tết',
          content: 'Người lao động được nghỉ làm việc, hưởng nguyên lương trong những ngày lễ, tết: Tết Dương lịch (01 ngày); Tết Âm lịch (05 ngày, số ngày cụ thể do Thủ tướng Chính phủ quyết định hằng năm); Ngày Chiến thắng 30/4 (01 ngày); Ngày Quốc tế lao động 01/5 (01 ngày); Quốc khánh 02/9 (02 ngày); Ngày Giỗ Tổ Hùng Vương 10/3 âm lịch (01 ngày).',
        },
      ],
    },
    {
      title: 'Chương VIII — Kỷ luật lao động',
      articles: [
        {
          number: 'Điều 125',
          title: 'Các hình thức xử lý kỷ luật lao động',
          content: '1. Khiển trách. 2. Kéo dài thời hạn nâng lương không quá 06 tháng hoặc cách chức. 3. Sa thải. Khi xử lý kỷ luật lao động phải có sự tham gia của tổ chức đại diện người lao động.',
        },
        {
          number: 'Điều 126',
          title: 'Sa thải',
          content: 'Hình thức xử lý kỷ luật sa thải được áp dụng trong trường hợp: a) Người lao động có hành vi trộm cắp, tham ô, đánh bạc, cố ý gây thương tích, sử dụng ma túy tại nơi làm việc; b) Tiết lộ bí mật kinh doanh, bí mật công nghệ, xâm phạm quyền sở hữu trí tuệ; c) Tự ý bỏ việc 05 ngày cộng dồn trong 30 ngày hoặc 20 ngày cộng dồn trong 365 ngày mà không có lý do chính đáng.',
        },
      ],
    },
    {
      title: 'Chương X — Bảo hiểm xã hội',
      articles: [
        {
          number: 'Điều 168',
          title: 'Tham gia bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp',
          content: 'Người sử dụng lao động, người lao động phải tham gia bảo hiểm xã hội bắt buộc, bảo hiểm y tế, bảo hiểm thất nghiệp. Mức đóng: Người sử dụng lao động đóng 21.5% (BHXH 17.5%, BHYT 3%, BHTN 1%); Người lao động đóng 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%).',
        },
      ],
    },
    {
      title: 'Chương XII — Lao động nữ',
      articles: [
        {
          number: 'Điều 137',
          title: 'Bảo vệ thai sản',
          content: 'Lao động nữ được nghỉ thai sản trước và sau khi sinh con là 06 tháng. Trường hợp sinh đôi trở lên thì tính từ con thứ hai trở đi, cứ mỗi con, người mẹ được nghỉ thêm 01 tháng. Thời gian nghỉ trước khi sinh tối đa không quá 02 tháng. Trong thời gian nghỉ thai sản, lao động nữ được hưởng chế độ thai sản theo quy định của pháp luật về bảo hiểm xã hội.',
        },
        {
          number: 'Điều 139',
          title: 'Bảo đảm việc làm cho lao động nữ',
          content: 'Người sử dụng lao động không được sa thải hoặc đơn phương chấm dứt hợp đồng lao động đối với lao động nữ vì lý do kết hôn, mang thai, nghỉ thai sản, nuôi con dưới 12 tháng tuổi, trừ trường hợp doanh nghiệp chấm dứt hoạt động.',
        },
      ],
    },
    {
      title: 'Chương XIV — Giải quyết tranh chấp lao động',
      articles: [
        {
          number: 'Điều 188',
          title: 'Trình tự giải quyết tranh chấp lao động cá nhân',
          content: '1. Hòa giải viên lao động hòa giải (trừ một số trường hợp không bắt buộc). 2. Hội đồng trọng tài lao động giải quyết. 3. Tòa án nhân dân giải quyết. Thời hiệu yêu cầu: 06 tháng đối với tranh chấp về xử lý kỷ luật lao động; 12 tháng đối với các tranh chấp khác.',
        },
      ],
    },
  ],
};
