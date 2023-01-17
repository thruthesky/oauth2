/**
 * 로컬에서 테스트 하는 경우, local 로 지정한다.
 *
 * 로컬에서는 로컬 Redirect URL 을 사용해야 한다.
 * 참고로, 로컬 테스트는 emulator 를 실행해야하며, 사용자 계정 생성이나, Firestore 문서, 로그 등이
 * emulator 에 저장된다.
 */
const workOn: "local" | "remote" = "remote";

/**
 * 개발 작업 및 테스트 하는 경우, true 로 지정하여 로그를 확인 할 수 있다.
 */
const debugLog = false;

/**
 * Firebase Cloud Functions 가 실행되는 Region. asia-northeast3 는 서울이다.
 */
const region = "asia-northeast3";

/**
 * Kakao, Naver 에서 사용하는 Redirect URL.
 *
 * 참고, Firebase Auth 에 계정을 생성할 때, Provider 지정을 할 수 없다.
 */
const kakaoProvider = "KAKAO";
const kakaoApiUrl = "https://kapi.kakao.com/v2/user/me?secure_resource=true";

const naverProvider = "NAVER";
const naverApiUrl = "https://openapi.naver.com/v1/nid/me";

const restApiKeyKakao = "d4b43fbf2599b19b50ef43b3524f0165";

/**
 * 참고, 로컬 컴퓨터 테스트에서는 이 URL 값을 emulators 의 것을 사용하면 된다.
 * 참고, 프로덕션에서 이 URL 값을 얻기 위해서는 먼저 배포를 해야 한다.
 *
 * 참고, 카카오톡과 네이버 용으로 분리해서 사용해야 한다.
 */
const localKakaoRedirectUri =
  "http://127.0.0.1:5001/withcenter-project/asia-northeast3/kakaoLogin";
const remoteKakaoRedirectUri =
  "https://asia-northeast3-withcenter-project.cloudfunctions.net/kakaoLogin";
/**
 * Attention: /oauth/token 요청을 할 때에는 encoded된 redirect_uri를 사용하면 안된다.
 * (중복 encode 하는 것 같다.)
 */
const urlencodedRedirectUri =
  "https%3A%2F%2Fasia-northeast3-withcenter-project.cloudfunctions.net%2FkakaoLogin";

export {
  workOn,
  debugLog,
  restApiKeyKakao,
  localKakaoRedirectUri,
  remoteKakaoRedirectUri,
  urlencodedRedirectUri,
  region,
  kakaoApiUrl,
  kakaoProvider,
  naverProvider,
  naverApiUrl,
};
