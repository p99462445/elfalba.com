
const ERROR_MAP: Record<string, string> = {
    // Auth errors
    "Invalid login credentials": "아이디 또는 비밀번호를 다시 확인해 주세요.",
    "Email not confirmed": "이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.",
    "User already registered": "이미 가입된 이메일입니다.",
    "Password should be at least 6 characters": "비밀번호는 6자리 이상이어야 합니다.",
    "Invalid email": "유효하지 않은 이메일 형식입니다.",
    "Too many requests": "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해 주세요.",
    "Network request failed": "네트워크 연결이 불안정합니다. 인터넷 연결을 확인해 주세요.",
    "Database error": "데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    "Failed to fetch": "서버 연결에 실패했습니다. 네트워크를 확인해 주세요.",
};

export function translateError(error: any): string {
    if (!error) return "알 수 없는 오류가 발생했습니다.";
    
    const message = typeof error === 'string' ? error : (error.message || "오류가 발생했습니다.");
    
    // Check for exact matches
    if (ERROR_MAP[message]) return ERROR_MAP[message];
    
    // Check for partial matches (case insensitive)
    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(ERROR_MAP)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return message;
}
