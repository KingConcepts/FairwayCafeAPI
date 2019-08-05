interface IVerificationResponse {
  id: string;
}

interface IDataStoredInToken {
  data: IVerificationResponse;
  iat: number
}

export default IDataStoredInToken;
