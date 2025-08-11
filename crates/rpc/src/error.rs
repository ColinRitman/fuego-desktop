use thiserror::Error;

/// RPC-specific errors
#[derive(Error, Debug)]
pub enum RPCError {
    #[error("Server error: {0}")]
    ServerError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("JSON-RPC error: {0}")]
    JsonRPCError(String),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("HTTP error: {0}")]
    HTTPError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Deserialization error: {0}")]
    DeserializationError(String),

    #[error("Method not found: {0}")]
    MethodNotFound(String),

    #[error("Invalid parameters: {0}")]
    InvalidParameters(String),

    #[error("Internal error: {0}")]
    InternalError(String),

    #[error("Timeout error: {0}")]
    TimeoutError(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Authentication failed: {0}")]
    AuthenticationError(String),

    #[error("Authorization failed: {0}")]
    AuthorizationError(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
}

impl From<std::io::Error> for RPCError {
    fn from(err: std::io::Error) -> Self {
        RPCError::ServerError(err.to_string())
    }
}

impl From<serde_json::Error> for RPCError {
    fn from(err: serde_json::Error) -> Self {
        RPCError::SerializationError(err.to_string())
    }
}

impl From<anyhow::Error> for RPCError {
    fn from(err: anyhow::Error) -> Self {
        RPCError::InternalError(err.to_string())
    }
}

impl From<tokio::time::error::Elapsed> for RPCError {
    fn from(_: tokio::time::error::Elapsed) -> Self {
        RPCError::TimeoutError("Request timed out".to_string())
    }
}

/// JSON-RPC error codes
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RPCErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    ServerError = -32000,
    Timeout = -32001,
    RateLimit = -32002,
    Authentication = -32003,
    Authorization = -32004,
    NotFound = -32005,
    BadRequest = -32006,
    ServiceUnavailable = -32007,
}

impl RPCErrorCode {
    pub fn as_i32(self) -> i32 {
        self as i32
    }

    pub fn message(self) -> &'static str {
        match self {
            RPCErrorCode::ParseError => "Parse error",
            RPCErrorCode::InvalidRequest => "Invalid request",
            RPCErrorCode::MethodNotFound => "Method not found",
            RPCErrorCode::InvalidParams => "Invalid params",
            RPCErrorCode::InternalError => "Internal error",
            RPCErrorCode::ServerError => "Server error",
            RPCErrorCode::Timeout => "Request timeout",
            RPCErrorCode::RateLimit => "Rate limit exceeded",
            RPCErrorCode::Authentication => "Authentication failed",
            RPCErrorCode::Authorization => "Authorization failed",
            RPCErrorCode::NotFound => "Resource not found",
            RPCErrorCode::BadRequest => "Bad request",
            RPCErrorCode::ServiceUnavailable => "Service unavailable",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rpc_error_code_values() {
        assert_eq!(RPCErrorCode::ParseError.as_i32(), -32700);
        assert_eq!(RPCErrorCode::InvalidRequest.as_i32(), -32600);
        assert_eq!(RPCErrorCode::MethodNotFound.as_i32(), -32601);
        assert_eq!(RPCErrorCode::InvalidParams.as_i32(), -32602);
        assert_eq!(RPCErrorCode::InternalError.as_i32(), -32603);
        assert_eq!(RPCErrorCode::ServerError.as_i32(), -32000);
    }

    #[test]
    fn test_rpc_error_code_messages() {
        assert_eq!(RPCErrorCode::ParseError.message(), "Parse error");
        assert_eq!(RPCErrorCode::MethodNotFound.message(), "Method not found");
        assert_eq!(RPCErrorCode::InternalError.message(), "Internal error");
    }
}