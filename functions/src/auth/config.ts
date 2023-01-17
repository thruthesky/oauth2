const kakaoProvider = "KAKAO";
const kakaoApiUrl = "https://kapi.kakao.com/v2/user/me?secure_resource=true";

const naverProvider = "NAVER";
const naverApiUrl = "https://openapi.naver.com/v1/nid/me";

const region = "asia-northeast3";

const restApiKey = "d4b43fbf2599b19b50ef43b3524f0165";

/**
 * 참고, 로컬 컴퓨터 테스트에서는 이 URL 값을 emulators 의 것을 사용하면 된다.
 * 참고, 프로덕션에서 이 URL 값을 얻기 위해서는 먼저 배포를 해야 한다.
 */
const redirectUri =
  "https://asia-northeast3-withcenter-project.cloudfunctions.net/kakaoLogin";
/**
 * Attention: /oauth/token 요청을 할 때에는 encoded된 redirect_uri를 사용하면 안된다.
 * (중복 encode 하는 것 같다.)
 */
const urlencodedRedirectUri =
  "https%3A%2F%2Fasia-northeast3-withcenter-project.cloudfunctions.net%2FkakaoLogin";

export {
  restApiKey,
  redirectUri,
  urlencodedRedirectUri,
  region,
  kakaoApiUrl,
  kakaoProvider,
  naverProvider,
  naverApiUrl,
};
