# Error Contract

All API errors use one stable JSON envelope.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "requestId": "optional-request-id",
    "details": {}
  }
}
```

## Common Error Codes

| Code | HTTP status | Use |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request shape or value is invalid. |
| `AUTH_REQUIRED` | 401 | Missing or invalid authentication context. |
| `AUTH_FORBIDDEN` | 403 | Authenticated actor is not allowed for the operation. |
| `NOT_FOUND` | 404 | Requested record does not exist or is unavailable to the actor. |
| `CONFLICT` | 409 | State conflict, duplicate record, or invalid lifecycle action. |
| `CONCURRENCY_CONFLICT` | 409 | Atomic capacity or duplicate-active-record conflict. |
| `UNSUPPORTED_EMAIL_DOMAIN` | 400 | University email domain is not supported. |
| `ACCOUNT_NOT_VERIFIED` | 403 | Account exists but email verification is incomplete. |
| `ACCOUNT_SUSPENDED` | 403 | Moderation has suspended the account. |
| `ACCOUNT_BANNED` | 403 | Moderation has banned the account. |
| `CAMPUS_SCOPE_VIOLATION` | 403 | Actor or resource is outside the selected campus scope. |
| `BLOCK_RELATIONSHIP_EXISTS` | 403 | Block enforcement prevents profile, activity, join, or notification context access. |
| `TARGET_UNAVAILABLE` | 410 | Notification or report context points to a deleted or inaccessible target. |

## Validation Error Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "validation": [
        {
          "field": "scheduledDateTime",
          "message": "must be in the future",
          "code": "invalid_datetime"
        }
      ]
    }
  }
}
```

## Auth Error Shape

```json
{
  "error": {
    "code": "AUTH_FORBIDDEN",
    "message": "The authenticated actor cannot access this campus",
    "details": {
      "authReason": "campus_not_authorized"
    }
  }
}
```

## Not Found Error Shape

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Activity not found",
    "details": {
      "resourceType": "Activity",
      "resourceId": "activity-id"
    }
  }
}
```

## Conflict and Concurrency Error Shape

```json
{
  "error": {
    "code": "CONCURRENCY_CONFLICT",
    "message": "The activity is no longer available for this operation",
    "details": {
      "conflictResource": "ActivityParticipation"
    }
  }
}
```
