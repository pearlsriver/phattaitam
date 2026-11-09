export const TERMS_VERSION = "1.0";

export const TERMS_CHECKBOX_TEXT =
  "Tôi đã đọc và đồng ý với Điều lệ tham gia Phật Tại Tâm. Tôi hiểu rằng mọi nội dung do tôi tự nguyện đóng góp được chia sẻ trên tinh thần phụng sự Phật pháp, phi thương mại, không yêu cầu thù lao hoặc tiền bản quyền từ Phật Tại Tâm. Tôi cam kết tôn trọng quyền tác giả và không đăng tải nội dung vi phạm quyền của người khác.";

export type TermsBlock =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export const TERMS_TITLE = "ĐIỀU LỆ THAM GIA VÀ CHIA SẺ NỘI DUNG";
export const TERMS_SITE = "PHẬT TẠI TÂM";
export const TERMS_MOTTO = "Phụng sự Phật pháp – Lan tỏa yêu thương – Chia sẻ vô cầu";

export const TERMS: TermsBlock[] = [
  { type: "h", text: "Lời ngỏ" },
  {
    type: "p",
    text: "Phật Tại Tâm (phattaitam.com) là không gian chia sẻ những giá trị tốt đẹp của Phật pháp thông qua kinh điển, văn học, thơ ca, âm nhạc, nghệ thuật và những suy ngẫm về cuộc sống.",
  },
  {
    type: "p",
    text: "Với tinh thần từ bi, trí tuệ, vô ngã và vị tha, chúng tôi mong muốn xây dựng một cộng đồng nơi mọi người có thể cùng học hỏi, sáng tạo và chia sẻ, không vì danh lợi, không vì mục đích thương mại, mà vì sự an lạc của bản thân và lợi ích của cộng đồng.",
  },
  {
    type: "p",
    text: "Mọi thành viên tham gia được khuyến khích thực hành tinh thần tùy duyên, vô cầu, không chấp trước, cùng tôn trọng những nguyên tắc sau đây.",
  },

  { type: "h", text: "Điều 1. Tôn chỉ và mục đích" },
  {
    type: "ul",
    items: [
      "Mọi nội dung đăng tải trên Phật Tại Tâm đều hướng đến những giá trị phù hợp với tinh thần Phật pháp, lấy từ bi, trí tuệ, chân thiện mỹ và sự an lạc làm nền tảng.",
      "Trang web hoạt động trên tinh thần tự nguyện, phi lợi nhuận, không nhằm mục đích kinh doanh hay tìm kiếm lợi ích vật chất từ những đóng góp của cộng đồng.",
      "Khuyến khích sáng tạo, học hỏi và chia sẻ những giá trị tinh thần tốt đẹp, không phân biệt tôn giáo, tín ngưỡng, nguồn gốc hay hoàn cảnh cá nhân.",
    ],
  },

  { type: "h", text: "Điều 2. Nguyên tắc chia sẻ nội dung" },
  {
    type: "ul",
    items: [
      "Mọi bài viết, bài thơ, tác phẩm âm nhạc, hình ảnh và các nội dung khác được đóng góp trên tinh thần tự nguyện, không vụ lợi.",
      "Người đóng góp không yêu cầu thù lao, tiền bản quyền hoặc bất kỳ khoản lợi ích vật chất nào từ việc đăng tải và chia sẻ nội dung trên trang web.",
      "Nội dung được chia sẻ nhằm phục vụ việc học hỏi, tu tập, thưởng thức và lan tỏa những giá trị tốt đẹp trong cộng đồng.",
      "Không sử dụng Phật Tại Tâm làm phương tiện quảng cáo, kinh doanh, vận động tài chính hoặc trục lợi dưới danh nghĩa Phật pháp.",
    ],
  },

  { type: "h", text: "Điều 3. Tinh thần không chấp giữ bản quyền" },
  {
    type: "ul",
    items: [
      "Người đóng góp được khuyến khích thực hành tinh thần bố thí pháp, chia sẻ vô cầu, không xem tác phẩm của mình là phương tiện để tìm kiếm danh lợi.",
      "Khi tự nguyện đăng tải tác phẩm do mình sáng tạo, người đóng góp đồng ý cho Phật Tại Tâm lưu trữ, hiển thị và phổ biến tác phẩm miễn phí nhằm phục vụ mục đích phi thương mại của trang web.",
      "Người đóng góp không yêu cầu tiền bản quyền hoặc thù lao đối với việc sử dụng tác phẩm trong phạm vi hoạt động phi thương mại của Phật Tại Tâm.",
      "Các thành viên được khuyến khích chia sẻ lại nội dung vì mục đích học hỏi, tu tập và lan tỏa Phật pháp, với thái độ tôn trọng tác giả và nguồn gốc tác phẩm.",
      "Việc chia sẻ vô cầu không đồng nghĩa với việc phủ nhận quyền tác giả theo pháp luật. Người đóng góp vẫn được tôn trọng quyền nhân thân và những quyền hợp pháp liên quan đến tác phẩm của mình.",
      "Không tự ý đăng tải tác phẩm của người khác khi chưa có quyền sử dụng hoặc sự cho phép phù hợp.",
    ],
  },
  { type: "p", text: "Tinh thần chung:" },
  { type: "quote", text: "Có sáng tạo mà không chấp công, có đóng góp mà không cầu lợi, có chia sẻ mà không mong báo đáp." },

  { type: "h", text: "Điều 4. Trách nhiệm của người tham gia" },
  { type: "p", text: "Mỗi thành viên khi tham gia Phật Tại Tâm tự nguyện cam kết:" },
  {
    type: "ul",
    items: [
      "Chia sẻ nội dung với thiện tâm, trung thực và có trách nhiệm.",
      "Không đăng tải nội dung kích động thù hận, chia rẽ, xúc phạm tín ngưỡng hoặc đi ngược tinh thần từ bi của Phật giáo.",
      "Không lợi dụng trang web để quảng bá cá nhân, kinh doanh hoặc thu lợi bất chính.",
      "Tôn trọng sự khác biệt trong nhận thức, quan điểm và phương pháp tu học.",
      "Chịu trách nhiệm về tính hợp pháp của những nội dung mình đóng góp.",
      "Không sao chép, sử dụng hoặc phân phối trái phép nội dung thuộc quyền của bên thứ ba.",
    ],
  },

  { type: "h", text: "Điều 5. Quyền quản lý nội dung" },
  {
    type: "ul",
    items: [
      "Ban quản trị Phật Tại Tâm có quyền xem xét, biên tập, phân loại hoặc từ chối đăng tải những nội dung không phù hợp với tôn chỉ của trang web.",
      "Ban quản trị có thể gỡ bỏ những nội dung vi phạm điều lệ, quyền tác giả hoặc các quy định pháp luật.",
      "Việc biên tập nội dung phải tôn trọng ý nghĩa cốt lõi của tác phẩm và quyền nhân thân của tác giả.",
      "Phật Tại Tâm không mua bán hoặc khai thác thương mại các tác phẩm được cộng đồng đóng góp nếu chưa có sự thỏa thuận phù hợp với người có quyền.",
    ],
  },

  { type: "h", text: "Điều 6. Tinh thần cộng đồng" },
  {
    type: "p",
    text: "Phật Tại Tâm không đặt nặng danh xưng, thành tích hay quyền sở hữu đối với những đóng góp tinh thần.",
  },
  {
    type: "p",
    text: "Mỗi bài viết, mỗi vần thơ, mỗi giai điệu hay mỗi lời chia sẻ đều được trân trọng như một nhân duyên lành.",
  },
  {
    type: "p",
    text: "Chúng tôi tin rằng giá trị của một tác phẩm không chỉ nằm ở người sáng tạo, mà còn ở những điều tốt đẹp tác phẩm ấy có thể mang đến cho cuộc đời.",
  },
  { type: "p", text: "Vì vậy, mọi thành viên được khuyến khích:" },
  {
    type: "ul",
    items: [
      "Sáng tạo bằng thiện tâm.",
      "Chia sẻ bằng lòng từ bi.",
      "Đón nhận bằng trí tuệ.",
      "Cho đi mà không mong cầu.",
      "Phụng sự mà không chấp công.",
    ],
  },

  { type: "h", text: "Điều 7. Hiệu lực và sự đồng thuận" },
  {
    type: "p",
    text: "Khi đăng ký tài khoản hoặc gửi nội dung đăng tải lên Phật Tại Tâm, thành viên xác nhận đã đọc, hiểu và đồng ý tuân thủ điều lệ này.",
  },
  {
    type: "p",
    text: "Ban quản trị có thể điều chỉnh điều lệ khi cần thiết để bảo đảm sự phát triển lành mạnh, minh bạch và phù hợp với tôn chỉ hoạt động của trang web.",
  },
];
