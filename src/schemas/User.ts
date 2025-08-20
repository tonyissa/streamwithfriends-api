export interface LoginRequest {
    username: string,
    password: string,
}

export interface RegisterRequest extends LoginRequest {
    inviteCode: string
}