const ErrorCustom = require("../exceptions/error-custom");
const { ValidationError } = require("sequelize");
const AdviceRepository = require("../repositories/advice.repository");

class AdviceService {
  adviceRepository = new AdviceRepository();
  
  // 게시물 생성
  createAdvice = async (userKey, title, categoryId, content) => {
    const createAdviceData = await this.adviceRepository.createAdvice(
      userKey,
      title,
      categoryId,
      content
    );

    return createAdviceData;
  };

  // 조언 게시물 전체 조회
  findAllAdvice = async () => {
    const findAllAdvice = await this.adviceRepository.findAllAdvice();
    return findAllAdvice.map((post) => {
      return {
        adviceId: post.adviceId,
        userKey: post.userKey,
        categoryId: post.categoryId,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        userImage: post.User.userImg,
        nickname: post.User.nickname,
        viewCount: post.viewCount,
      };
    });
  };

  // 조언 게시물 카테고리별 조회
  findCategoryAdvice = async (categoryId) => {
    const findCategoryAdvice = await this.adviceRepository.findCategoryAdvice(
      categoryId
    );
    const data = findCategoryAdvice.map((post) => {
      return {
        adviceId: post.adviceId,
        categoryId: post.categoryId,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        userImage: post.User.userImg,
        nickname: post.User.nickname,

        viewCount: post.viewCount,
      };
    });
    return data;
  };

  //  조언 게시물 상세페이지 조회
  findOneAdvice = async (userKey, adviceId) => {
    const findOneAdvice = await this.adviceRepository.findOneAdvice(
      userKey,
      adviceId
    );

    const findAdviceImageArray = findOneAdvice.AdviceImages.map(
      (post) => {
        return [post.dataValues.adviceImageId, post.adviceImage];
      }

    );

    let boolean;
    findOneAdvice.AdviceBMs.length ? (boolean = true) : (boolean = false);
    return {
      adviceId: findOneAdvice.adviceId,
      categoryId: findOneAdvice.categoryId,
      userKey: findOneAdvice.User.userKey,
      title: findOneAdvice.title,
      content: findOneAdvice.content,
      createdAt: findOneAdvice.createdAt,
      updatedAt: findOneAdvice.updatedAt,
      userImage: findOneAdvice.User.userImg,
      nickname: findOneAdvice.User.nickname,
      adviceImage: findAdviceImageArray,
      isBookMark: boolean,
      commentcount: findOneAdvice.Comments.length,
    };
  };

  // 이미지 찾기(조언 게시글 수정용)
  findImages = async (imageId) => {
    const findImage = await this.adviceRepository.findImages(imageId);
    return findImage;
  };

  // 조언 게시물 타이틀 수정
  updateAdviceTitle = async (adviceId, title) => {
    const findAdvice = await this.adviceRepository.findAllAdvice(adviceId);
    if (!findAdvice) throw new ErrorCustom(400, "게시물이 존재하지 않습니다.");

    await this.adviceRepository.updateAdviceTitle(adviceId, title);

  };

  // 조언 게시물 콘텐츠 수정
  updateAdviceContent = async (adviceId, content) => {
    const findAdvice = await this.adviceRepository.findAllAdvice(adviceId);
    if (!findAdvice) throw new ErrorCustom(400, "게시물이 존재하지 않습니다.");

    await this.adviceRepository.updateAdviceContent(adviceId, content);

  };

  // 조언 게시물 조회 수
  upCountView = async (adviceId, userKey) => {
    const findAdvice = await this.adviceRepository.findAdvice(adviceId);

    if (userKey !== findAdvice.userKey) {
      await this.adviceRepository.upCountView(adviceId);
    }
  };

  // 조언 게시물 삭제
  adviceDelete = async (adviceId) => {
    await this.adviceRepository.adviceDelete(adviceId);
  };
  
}

module.exports = AdviceService;
