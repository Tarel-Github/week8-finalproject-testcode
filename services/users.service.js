const ErrorCustom = require("../exceptions/error-custom");
const UserRepository = require("../repositories/users.repository.js");
const AdviceRepository = require("../repositories/advice.repository");
const ChoiceRepository = require("../repositories/choice.repository");
const MissionRepository = require("../repositories/mission.repository");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { boolean } = require("joi");
require("dotenv").config();

class UserService {
  userRepository = new UserRepository();
  adviceRepository = new AdviceRepository();
  choiceRepository = new ChoiceRepository();
  missionRepository = new MissionRepository();

  //유저 생성(가입)
  createUser = async ({
    userId: userId,
    nickname: nickname,
    password: hashed,
    IsAdult: IsAdult,
  }) => {
    IsAdult == "true" ? (IsAdult = true) : (IsAdult = false);
    await this.userRepository.createUser({
      userId: userId,
      nickname: nickname,
      password: hashed,
      IsAdult: IsAdult,
    });
  };

  //유저 검증
  verifyUser = async (userId, password) => {
    const user = await this.userRepository.findUserId(userId);
    if (!user) throw new ErrorCustom(400, "가입되지 않은 아이디 입니다");

    const passwordVerify = await bcrypt.compare(password, user.password);

    if (!passwordVerify) throw new ErrorCustom(400, "비밀번호 오류");
    const accessToken = jwt.sign(
      { userId: user.userId, userKey: user.userKey },
      process.env.SECRET_KEY
      // {
      //   expiresIn: "5s",
      // }
    );

    const refreshToken = jwt.sign({}, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    return { accessToken, refreshToken };
  };

  //닉네임 중복검사
  findNickname = async (nickname) => {
    const findNickname = await this.userRepository.findNickname(nickname);
    if (findNickname)
      throw new ErrorCustom(400, "이미 존재하는 닉네임 입니다.");
    return;
  };

  //아이디 중복검사
  findUserId = async (userId) => {
    const findUserId = await this.userRepository.findUserId(userId);
    if (findUserId) throw new ErrorCustom(400, "이미 존재하는 아이디 입니다.");
    return;
  };

  //메인페이지 데이터 가공해서 보내주기
  mainPage = async (userKey) => {
    const getChoice = await this.choiceRepository.choiceHot(userKey);

    const choiceData = getChoice.map((post) => {
      let boolean;
      post.ChoiceBMs.length ? (boolean = true) : (boolean = false);
      return {
        choiceId: post.choiceId,
        title: post.title,
        choice1Name: post.choice1Name,
        choice2Name: post.choice2Name,
        choice1Per: post.choice1Per,
        choice2Per: post.choice2Per,
        userImage: post.User.userImg,
        nickname: post.User.nickname,
        createdAt: post.createdAt,
        endTime: post.endTime,
        choiceCount: post.choiceCount,
        isBookMark: boolean,
        userKey: post.userKey,
      };
    });

    const getAdvice = await this.adviceRepository.adviceHot();

    const adviceData = getAdvice.map((post) => {
      return {
        adviceId: post.adviceId,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        viewCount: post.viewCount,
        CommentCount: post.Comments.length,
        userKey: post.userKey,
      };
    });

    return { choice: choiceData, advice: adviceData };
  };

  //마이페이지 데이터 가져오기
  mypage = async (userKey) => {
    const user = await this.userRepository.findUser(userKey);
    //console.log(user, "무엇인가?")

    // if (user.Comments.length >= mission.adviceCount) {
    //   await this.missionComplete.create(userKey, missioni);
    // }
    const result = {
      userKey: userKey,
      nickname: user.nickname,
      userImage: user.userImage,
      totalAdvice: user.Comments.length,
      totalChoice: user.isChoices.length,
    };
    //console.log(result, "어떤게 들어있나")
    return result;
  };

  //검색 가져오기
  search = async (userKey, keyword) => {
    const getChoice = await this.choiceRepository.choiceSeach(userKey, keyword);

    const choiceData = getChoice.map((post) => {
      let boolean;
      post.ChoiceBMs.length ? (boolean = true) : (boolean = false);
      return {
        choiceId: post.choiceId,
        title: post.title,
        choice1Name: post.choice1Name,
        choice2Name: post.choice2Name,
        choice1Per: post.choice1Per,
        choice2Per: post.choice2Per,
        userImage: post.User.userImg,
        nickname: post.User.nickname,
        createdAt: post.createdAt,
        endTime: post.endTime,
        choiceCount: post.choiceCount,
        isBookMark: boolean,
        userKey: post.userKey,
      };
    });

    const getAdvice = await this.adviceRepository.adviceSearch(keyword);

    const adviceData = getAdvice.map((post) => {
      return {
        adviceId: post.adviceId,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        viewCount: post.viewCount,
        CommentCount: post.Comments.length,
        userKey: post.userKey,
      };
    });

    return { choice: choiceData, advice: adviceData };
  };

  uploadUserImage = async (imageUrl, userKey) => {
    const foundData = await this.userRepository.findUser(userKey);
    const userIdData = foundData.userKey;

    console.log("유저:", userIdData, "잘 받아오나 보자");
    if (!foundData) throw new ErrorCustom(400, "사용자가 존재하지 않습니다.");

    const uploadImage = imageUrl;
    console.log(uploadImage, "아무거나");

    const uploadImagesData = await this.userRepository.uploadUserImage(
      uploadImage,
      userKey
    );
    return uploadImagesData;
  };

  reword = async (userKey) => {
    //휙득한 좋아요수
    const totalReword = await this.userRepository.totalReword(userKey);
    //내가 받은 총 좋아요수
    const likeArray = totalReword[0].Comments.map((x) => x.CommentLikes.length);
    let likeTotal = 0;
    likeArray.forEach((x) => {
      likeTotal += x;
    });
    //내 게시글의 총 조회수
    const viewCountArray = totalReword[0].Advice.map((x) => x.viewCount);
    let viewCount = 0;
    viewCountArray.forEach((x) => {
      viewCount += x;
    });
    //내가 조언해준 횟수
    const totalAdvice = totalReword[0].Comments.length;
    //내가 투표한횟수
    const totalChoice = totalReword[0].isChoices.length;
    //
    const totalPost = totalReword[0].Advice.length;

    console.log(
      `totalAdvice:${totalAdvice}, totalChoice:${totalChoice}, totalPost:${totalPost},viewCount:${viewCount},likeTotal:${likeTotal}`
    );
    const missionarray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const completedMission = await this.missionRepository.completeMission(
      userKey
    );
    const CompleteMission = completedMission.map((x) => x.missionId);
    const unCompleteMission = missionarray.filter(
      (x) => !CompleteMission.includes(x)
    );
    console.log(unCompleteMission);
    console.log(CompleteMission);
    const mission = await this.missionRepository.mission(unCompleteMission);
    const newCompleteMissionId = [];
    mission.forEach((x) => {
      x.missionId;
      if (x.AdviceMission) {
        x.AdviceMission.adviceMission <= totalAdvice
          ? newCompleteMissionId.push(x.missionId)
          : false;
      }
      if (x.ChoiceMission) {
        x.ChoiceMission.choiceMission <= totalChoice
          ? newCompleteMissionId.push(x.missionId)
          : false;
      }
      if (x.PostMission) {
        x.PostMission.postMission <= totalPost
          ? newCompleteMissionId.push(x.missionId)
          : false;
      }
      if (x.LikeMission) {
        x.LikeMission.likeMission <= likeTotal
          ? newCompleteMissionId.push(x.missionId)
          : false;
      }
    });

    for (const missionId of newCompleteMissionId) {
      await this.missionRepository.createCompleteMission(userKey, missionId);
    }

    const missionComplete = await this.missionRepository.completeMission(
      userKey
    );
    const missionCompleteId = missionComplete.map((x) => {
      return [x.missionId, x.isGet];
    });
    console.log(missionCompleteId);

    let result = [];
    for (let i = 1; i < 10; i++) {
      let isComplete = false;
      let isGet = false;
      missionCompleteId.forEach((x) => {
        if (x[0] == i) {
          isComplete = true;
        }
        if (x[0] == i && x[1] == 1) {
          isGet = true;
        }
      });

      result.push({
        mission: i,
        isComplete: isComplete,
        isGet: isGet,
      });
    }

    return result;
  };

  getReword = async (userKey, missionId) => {
    await this.missionRepository.getReword(userKey, missionId);
  };

  updateUserNickname = async (userKey, nickname) => {
    const findUser = await this.userRepository.findUser(userKey);
    if (!findUser) throw new ErrorCustom(400, "사용자가 존재하지 않습니다.");
    await this.userRepository.updateUserNickname(userKey, nickname);
  };
}

module.exports = UserService;
