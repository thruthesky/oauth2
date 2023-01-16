const kakaoProvider = "KAKAO";
const kakaoApiUrl = "https://kapi.kakao.com/v2/user/me?secure_resource=true";

const naverProvider = "NAVER";
const naverApiUrl = "https://openapi.naver.com/v1/nid/me";

const region = "asia-northeast3";

const restApiKey = "d4b43fbf2599b19b50ef43b3524f0165";
const redirectUri =
  "http://127.0.0.1:5001/withcenter-project/asia-northeast3/kakaoLogin";
/**
 * Attention: /oauth/token 요청을 할 때에는 encoded된 redirect_uri를 사용하면 안된다. (중복 encode 하는 것 같다.)
 */
const urlencodedRedirectUri =
  "http%3A%2F%2F127.0.0.1%3A5001%2Fwithcenter-project%2Fasia-northeast3%2FkakaoLogin";

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
