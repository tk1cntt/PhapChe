/**
 * Bộ luật Dân sự 2015 (Law No. 91/2015/QH13)
 *
 * Các điều khoản quan trọng nhất cho dịch vụ pháp lý dân sự và thương mại.
 * Domain: commercial-legal, corporate-legal, litigation-legal
 */

import type { LegalKnowledgeDoc } from './types';

export const boLuatDanSu2015: LegalKnowledgeDoc = {
  id: 'bo-luat-dan-su-2015',
  source: 'Bộ luật Dân sự 2015 (Số 91/2015/QH13)',
  /**
   * NOTE: This document reflects selected provisions as enacted in 2015.
   * No amendments are incorporated. Verify against current law before
   * relying on specific provisions in legal advice.
   */
  domainTags: ['commercial-legal', 'corporate-legal', 'litigation-legal'],
  version: '2015',
  chapters: [
    // NOTE: Only key civil/commercial chapters are included below.
    // Gaps between chapter numbers represent omitted chapters.
    {
      title: 'Chương I — Những quy định chung',
      articles: [
        {
          number: 'Điều 1',
          title: 'Phạm vi điều chỉnh',
          content: 'Bộ luật Dân sự quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản của cá nhân, pháp nhân trong các quan hệ được hình thành trên cơ sở bình đẳng, tự do ý chí, độc lập về tài sản và tự chịu trách nhiệm.',
        },
        {
          number: 'Điều 3',
          title: 'Nguyên tắc cơ bản của pháp luật dân sự',
          content: '1. Cá nhân, pháp nhân đều bình đẳng, không được lấy bất kỳ lý do nào để phân biệt đối xử. 2. Cá nhân, pháp nhân tự do, tự nguyện cam kết, thỏa thuận. 3. Cá nhân, pháp nhân phải tự chịu trách nhiệm về việc không thực hiện hoặc thực hiện không đúng nghĩa vụ dân sự. 4. Thiện chí, trung thực. 5. Tôn trọng lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác. 6. Tôn trọng, bảo vệ quyền dân sự.',
        },
        {
          number: 'Điều 4',
          title: 'Nguồn của pháp luật dân sự',
          content: '1. Bộ luật Dân sự, các luật khác có liên quan. 2. Điều ước quốc tế mà Việt Nam là thành viên. 3. Tập quán có giá trị áp dụng. 4. Án lệ. 5. Lẽ công bằng.',
        },
        {
          number: 'Điều 5',
          title: 'Thời hiệu',
          content: 'Thời hiệu là thời hạn do luật quy định mà khi kết thúc thời hạn đó thì phát sinh hậu quả pháp lý đối với chủ thể theo điều kiện do luật quy định. Tòa án chỉ áp dụng quy định về thời hiệu đối với yêu cầu áp dụng thời hiệu của một bên hoặc các bên với điều kiện yêu cầu này phải được đưa ra trước khi Tòa án cấp sơ thẩm ra bản án, quyết định giải quyết vụ việc.',
        },
        {
          number: 'Điều 5 (tóm tắt mở rộng)',
          title: 'Các thời hiệu khởi kiện quan trọng',
          content: 'Thời hiệu hưởng quyền dân sự: 30 năm đối với bất động sản, 10 năm đối với động sản (Điều 236, 237). Thời hiệu khởi kiện hợp đồng: 03 năm (Điều 4 - Luật Thương mại 2005 áp dụng bổ sung). Thời hiệu khởi kiện bồi thường thiệt hại ngoài hợp đồng: 03 năm (Điều 588).',
        },
        {
          number: 'Điều 6',
          title: 'Nguyên tắc thực hiện quyền dân sự',
          content: 'Cá nhân, pháp nhân thực hiện quyền dân sự theo ý chí của mình, không được trái với điều cấm của luật, không trái đạo đức xã hội. Việc thực hiện quyền dân sự không được xâm phạm đến lợi ích quốc gia, dân tộc, quyền và lợi ích hợp pháp của người khác.',
        },
      ],
    },
    {
      title: 'Chương VII — Giao dịch dân sự',
      articles: [
        {
          number: 'Điều 116',
          title: 'Giao dịch dân sự',
          content: 'Giao dịch dân sự là hợp đồng hoặc hành vi pháp lý đơn phương làm phát sinh, thay đổi hoặc chấm dứt quyền, nghĩa vụ dân sự.',
        },
        {
          number: 'Điều 117',
          title: 'Điều kiện có hiệu lực của giao dịch dân sự',
          content: 'Giao dịch dân sự có hiệu lực khi có đủ các điều kiện: a) Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập; b) Chủ thể tham gia giao dịch hoàn toàn tự nguyện; c) Mục đích và nội dung của giao dịch không vi phạm điều cấm của luật, không trái đạo đức xã hội. Hình thức của giao dịch dân sự là điều kiện có hiệu lực trong trường hợp luật có quy định.',
        },
        {
          number: 'Điều 122',
          title: 'Giao dịch dân sự vô hiệu',
          content: 'Giao dịch dân sự không có một trong các điều kiện tại Điều 117 thì vô hiệu, trừ trường hợp Bộ luật này có quy định khác.',
        },
        {
          number: 'Điều 123',
          title: 'Giao dịch dân sự vô hiệu do vi phạm điều cấm của luật, trái đạo đức xã hội',
          content: 'Giao dịch dân sự có mục đích, nội dung vi phạm điều cấm của luật, trái đạo đức xã hội thì vô hiệu.',
        },
        {
          number: 'Điều 127',
          title: 'Giao dịch dân sự vô hiệu do bị lừa dối, đe dọa, cưỡng ép',
          content: 'Khi một bên tham gia giao dịch dân sự do bị lừa dối, đe dọa, cưỡng ép thì có quyền yêu cầu Tòa án tuyên bố giao dịch dân sự đó là vô hiệu. Thời hiệu yêu cầu tuyên bố vô hiệu là 02 năm.',
        },
        {
          number: 'Điều 131',
          title: 'Hậu quả pháp lý của giao dịch dân sự vô hiệu',
          content: 'Giao dịch dân sự vô hiệu không làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ dân sự của các bên kể từ thời điểm giao dịch được xác lập. Các bên khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận.',
        },
      ],
    },
    {
      title: 'Chương XVI — Hợp đồng dân sự',
      articles: [
        {
          number: 'Điều 385',
          title: 'Khái niệm hợp đồng',
          content: 'Hợp đồng là sự thỏa thuận giữa các bên về việc xác lập, thay đổi hoặc chấm dứt quyền, nghĩa vụ dân sự.',
        },
        {
          number: 'Điều 386',
          title: 'Đề nghị giao kết hợp đồng',
          content: 'Đề nghị giao kết hợp đồng là việc thể hiện rõ ý định giao kết hợp đồng và chịu sự ràng buộc về đề nghị này của bên đề nghị đối với bên đã được xác định hoặc tới công chúng. Đề nghị giao kết hợp đồng phải có các nội dung chủ yếu của hợp đồng.',
        },
        {
          number: 'Điều 393',
          title: 'Chấp nhận đề nghị giao kết hợp đồng',
          content: 'Chấp nhận đề nghị giao kết hợp đồng là sự trả lời của bên được đề nghị về việc chấp nhận toàn bộ nội dung của đề nghị.',
        },
        {
          number: 'Điều 398',
          title: 'Nội dung của hợp đồng',
          content: 'Các bên có quyền thỏa thuận về nội dung của hợp đồng. Hợp đồng có thể có các nội dung: đối tượng của hợp đồng; số lượng, chất lượng; giá, phương thức thanh toán; thời hạn, địa điểm, phương thức thực hiện; quyền, nghĩa vụ của các bên; trách nhiệm do vi phạm hợp đồng; phương thức giải quyết tranh chấp.',
        },
        {
          number: 'Điều 401',
          title: 'Hiệu lực của hợp đồng',
          content: 'Hợp đồng được giao kết hợp pháp có hiệu lực từ thời điểm giao kết, trừ trường hợp có thỏa thuận khác hoặc luật liên quan có quy định khác. Hợp đồng chỉ có thể bị sửa đổi hoặc hủy bỏ theo thỏa thuận của các bên hoặc theo quy định của luật.',
        },
        {
          number: 'Điều 405',
          title: 'Hợp đồng theo mẫu',
          content: 'Hợp đồng theo mẫu là hợp đồng gồm những điều khoản do một bên đưa ra theo mẫu để bên kia trả lời trong thời gian hợp lý. Bên đưa ra hợp đồng theo mẫu phải niêm yết công khai để bên kia biết hoặc phải biết về những nội dung đó. Trường hợp hợp đồng theo mẫu có điều khoản không rõ ràng thì điều khoản này được giải thích theo hướng có lợi cho bên kia.',
        },
        {
          number: 'Điều 418',
          title: 'Phạt vi phạm',
          content: 'Phạt vi phạm là sự thỏa thuận giữa các bên trong hợp đồng, theo đó bên vi phạm nghĩa vụ phải nộp một khoản tiền cho bên bị vi phạm. Mức phạt vi phạm do các bên thỏa thuận, trừ trường hợp luật liên quan có quy định khác. Lưu ý: Đối với hợp đồng thương mại, Điều 301 Luật Thương mại 2005 giới hạn mức phạt không quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm.',
        },
        {
          number: 'Điều 419',
          title: 'Bồi thường thiệt hại',
          content: 'Thiệt hại được bồi thường do vi phạm nghĩa vụ hợp đồng được xác định bao gồm: thiệt hại vật chất thực tế và khoản lợi trực tiếp mà bên bị vi phạm đáng lẽ được hưởng nếu không có hành vi vi phạm. Người có quyền có thể yêu cầu bồi thường thiệt hại cho lợi ích mà lẽ ra mình được hưởng do hợp đồng mang lại.',
        },
        {
          number: 'Điều 422',
          title: 'Chấm dứt hợp đồng',
          content: 'Hợp đồng chấm dứt trong trường hợp: a) Hợp đồng đã được hoàn thành; b) Theo thỏa thuận của các bên; c) Cá nhân giao kết hợp đồng chết, pháp nhân chấm dứt tồn tại mà hợp đồng phải do chính cá nhân, pháp nhân đó thực hiện; d) Hợp đồng bị hủy bỏ, bị đơn phương chấm dứt thực hiện; đ) Hợp đồng không thể thực hiện được do đối tượng của hợp đồng không còn.',
        },
      ],
    },
    {
      title: 'Chương XX — Bồi thường thiệt hại ngoài hợp đồng',
      articles: [
        {
          number: 'Điều 584',
          title: 'Căn cứ phát sinh trách nhiệm bồi thường thiệt hại',
          content: 'Người nào có hành vi xâm phạm tính mạng, sức khỏe, danh dự, nhân phẩm, uy tín, tài sản, quyền, lợi ích hợp pháp khác của người khác mà gây thiệt hại thì phải bồi thường, trừ trường hợp thiệt hại phát sinh do sự kiện bất khả kháng hoặc hoàn toàn do lỗi của bên bị thiệt hại.',
        },
        {
          number: 'Điều 585',
          title: 'Nguyên tắc bồi thường thiệt hại',
          content: 'Thiệt hại thực tế phải được bồi thường toàn bộ và kịp thời. Các bên có thể thỏa thuận về mức bồi thường, hình thức bồi thường bằng tiền, bằng hiện vật hoặc thực hiện một công việc. Người chịu trách nhiệm bồi thường có thể được giảm mức bồi thường nếu không có lỗi hoặc có lỗi vô ý và thiệt hại quá lớn so với khả năng kinh tế.',
        },
        {
          number: 'Điều 597',
          title: 'Bồi thường thiệt hại do người của pháp nhân gây ra',
          content: 'Pháp nhân phải bồi thường thiệt hại do người của mình gây ra trong khi thực hiện nhiệm vụ được pháp nhân giao. Nếu pháp nhân đã bồi thường thiệt hại thì có quyền yêu cầu người có lỗi trong việc gây thiệt hại phải hoàn trả một khoản tiền theo quy định của pháp luật.',
        },
      ],
    },
    {
      title: 'Chương XXI — Thực hiện nghĩa vụ',
      articles: [
        {
          number: 'Điều 275',
          title: 'Căn cứ phát sinh nghĩa vụ',
          content: 'Nghĩa vụ phát sinh từ: hợp đồng; hành vi pháp lý đơn phương; thực hiện công việc không có ủy quyền; chiếm hữu, sử dụng tài sản hoặc hưởng lợi về tài sản không có căn cứ pháp luật; gây thiệt hại do hành vi trái pháp luật; các căn cứ khác do luật quy định.',
        },
        {
          number: 'Điều 351',
          title: 'Trách nhiệm dân sự do vi phạm nghĩa vụ',
          content: 'Bên có nghĩa vụ mà vi phạm nghĩa vụ thì phải chịu trách nhiệm dân sự đối với bên có quyền. Trường hợp vi phạm nghĩa vụ do sự kiện bất khả kháng thì không phải chịu trách nhiệm dân sự, trừ trường hợp có thỏa thuận khác hoặc pháp luật có quy định khác.',
        },
        {
          number: 'Điều 352',
          title: 'Thực hiện nghĩa vụ dân sự',
          content: 'Nghĩa vụ dân sự phải được thực hiện đúng hợp đồng hoặc đúng quy định của pháp luật. Việc thực hiện nghĩa vụ dân sự không được xâm phạm đến lợi ích quốc gia, dân tộc, lợi ích công cộng, quyền và lợi ích hợp pháp của người khác.',
        },
      ],
    },
    {
      title: 'Chương XXIII — Chuyển giao quyền yêu cầu và chuyển giao nghĩa vụ',
      articles: [
        {
          number: 'Điều 365',
          title: 'Chuyển giao quyền yêu cầu',
          content: 'Bên có quyền yêu cầu thực hiện nghĩa vụ có thể chuyển giao quyền yêu cầu đó cho người thế quyền, trừ trường hợp quyền yêu cầu gắn liền với nhân thân hoặc các bên có thỏa thuận không được chuyển giao. Việc chuyển giao quyền yêu cầu không cần có sự đồng ý của bên có nghĩa vụ.',
        },
        {
          number: 'Điều 370',
          title: 'Chuyển giao nghĩa vụ',
          content: 'Bên có nghĩa vụ có thể chuyển giao nghĩa vụ cho người thế nghĩa vụ nếu được bên có quyền đồng ý, trừ trường hợp nghĩa vụ gắn liền với nhân thân hoặc pháp luật có quy định không được chuyển giao nghĩa vụ.',
        },
      ],
    },
    {
      title: 'Chương XXVII — Pháp nhân',
      articles: [
        {
          number: 'Điều 74',
          title: 'Pháp nhân',
          content: 'Một tổ chức được công nhận là pháp nhân khi có đủ các điều kiện: a) Được thành lập theo quy định của pháp luật; b) Có cơ cấu tổ chức chặt chẽ; c) Có tài sản độc lập với cá nhân, pháp nhân khác và tự chịu trách nhiệm bằng tài sản của mình; d) Nhân danh mình tham gia quan hệ pháp luật một cách độc lập.',
        },
        {
          number: 'Điều 75',
          title: 'Pháp nhân thương mại',
          content: 'Pháp nhân thương mại là pháp nhân có mục tiêu chính là tìm kiếm lợi nhuận và lợi nhuận được chia cho các thành viên. Pháp nhân thương mại bao gồm doanh nghiệp và các tổ chức kinh tế khác. Việc thành lập, hoạt động và chấm dứt pháp nhân thương mại được thực hiện theo quy định của pháp luật.',
        },
        {
          number: 'Điều 86',
          title: 'Năng lực pháp luật dân sự của pháp nhân',
          content: 'Năng lực pháp luật dân sự của pháp nhân là khả năng của pháp nhân có các quyền, nghĩa vụ dân sự. Năng lực pháp luật dân sự của pháp nhân phát sinh từ thời điểm pháp nhân được thành lập và chấm dứt kể từ thời điểm chấm dứt pháp nhân.',
        },
        {
          number: 'Điều 87',
          title: 'Trách nhiệm dân sự của pháp nhân',
          content: 'Pháp nhân phải chịu trách nhiệm dân sự về việc thực hiện quyền, nghĩa vụ dân sự do người đại diện xác lập, thực hiện nhân danh pháp nhân. Pháp nhân chịu trách nhiệm dân sự bằng tài sản của mình.',
        },
      ],
    },
    {
      title: 'Chương XXIX — Sở hữu',
      articles: [
        {
          number: 'Điều 158',
          title: 'Quyền sở hữu',
          content: 'Quyền sở hữu bao gồm quyền chiếm hữu, quyền sử dụng và quyền định đoạt tài sản của chủ sở hữu theo quy định của luật.',
        },
        {
          number: 'Điều 160',
          title: 'Nguyên tắc bảo vệ quyền sở hữu',
          content: 'Quyền sở hữu được pháp luật bảo hộ. Không ai có thể bị hạn chế, bị tước đoạt trái pháp luật quyền sở hữu đối với tài sản của mình. Chủ sở hữu có quyền tự bảo vệ quyền sở hữu, ngăn chặn bất kỳ người nào có hành vi xâm phạm quyền sở hữu.',
        },
        {
          number: 'Điều 164',
          title: 'Quyền đòi lại tài sản',
          content: 'Chủ sở hữu, chủ thể có quyền khác đối với tài sản có quyền đòi lại tài sản từ người chiếm hữu, sử dụng tài sản, người được lợi về tài sản không có căn cứ pháp luật.',
        },
        {
          number: 'Điều 175',
          title: 'Sở hữu chung',
          content: 'Sở hữu chung là sở hữu của nhiều chủ thể đối với tài sản. Sở hữu chung bao gồm sở hữu chung theo phần và sở hữu chung hợp nhất. Sở hữu chung theo phần: mỗi chủ sở hữu có quyền, nghĩa vụ đối với tài sản chung tương ứng với phần quyền sở hữu của mình.',
        },
      ],
    },
  ],
};
