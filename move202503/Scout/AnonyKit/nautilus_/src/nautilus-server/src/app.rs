/ Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use crate::common::IntentMessage;
use crate::common::{to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse};
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
/// ====
/// Core Nautilus server logic for anonymous voting
/// ====

/// Inner type T for IntentMessage<T>
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VoteResponse {
    pub vote: String,  // 投票选项，例如 "A" 或 "B"
}

/// Inner type T for ProcessDataRequest<T>
#[derive(Debug, Serialize, Deserialize)]
pub struct VoteRequest {
    pub vote: String,
}

pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<VoteRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<VoteResponse>>>, EnclaveError> {
    // 验证投票选项
    let valid_votes = vec!["A", "B"];
    if !valid_votes.contains(&request.payload.vote.as_str()) {
        return Err(EnclaveError::GenericError(format!(
            "Invalid vote: {}. Must be one of {:?}",
            request.payload.vote, valid_votes
        )));
    }

    // 获取当前时间戳（毫秒）
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| EnclaveError::GenericError(format!("Failed to get current timestamp: {}", e)))?
        .as_millis() as u64;

    // 返回签名响应
    Ok(Json(to_signed_response(
        &state.eph_kp,
        VoteResponse {
            vote: request.payload.vote,
        },
        timestamp_ms,
        IntentScope::Weather,  // 使用 Weather 作为 IntentScope（可自定义）
    )))
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::common::IntentMessage;
    use axum::{extract::State, Json};
    use fastcrypto::{ed25519::Ed25519KeyPair, traits::KeyPair};

    #[tokio::test]
    async fn test_process_data() {
        let state = Arc::new(AppState {
            eph_kp: Ed25519KeyPair::generate(&mut rand::thread_rng()),
            api_key: "".to_string(),  // api_key 未使用
        });
        let signed_vote_response = process_data(
            State(state),
            Json(ProcessDataRequest {
                payload: VoteRequest {
                    vote: "A".to_string(),
                },
            }),
        )
            .await
            .unwrap();
        assert_eq!(
            signed_vote_response.response.data.vote,
            "A"
        );
    }

    #[test]
    fn test_serde() {
        // test result should be consistent with test_serde in `move/enclave/sources/enclave.move`.
        use fastcrypto::encoding::{Encoding, Hex};
        let payload = VoteResponse {
            vote: "A".to_string(),
        };
        let timestamp = 1744038900000;
        let intent_msg = IntentMessage::new(payload, timestamp, IntentScope::Weather);
        let signing_payload = bcs::to_bytes(&intent_msg).expect("should not fail");
        assert!(
            signing_payload
                == Hex::decode("0020b1d110960100000141")
                .unwrap()
        );
    }
}