VK_API_AUTH_CODES = frozenset({5, 7, 8, 15, 27, 28, 100})
VK_API_RATE_LIMIT_CODES = frozenset({6, 9, 29})
VK_API_CAPTCHA_CODE = 14
VK_API_INFRA_CODE = 10


class VkApiDomainError(RuntimeError):
    def __init__(self, code: int, error_msg: str, method: str = ""):
        self.code = code
        self.error_msg = error_msg
        self.method = method
        super().__init__(self._format())

    def _format(self) -> str:
        return f"[{self.code}] {self.error_msg}"


class VkApiAuthError(VkApiDomainError):
    pass


class VkApiRateLimitError(VkApiDomainError):
    pass


class VkApiCaptchaError(VkApiDomainError):
    pass


class VkApiInfrastructureError(VkApiDomainError):
    pass


def map_vk_error(code: int, error_msg: str, method: str = "") -> VkApiDomainError:
    if code in VK_API_AUTH_CODES:
        return VkApiAuthError(code, error_msg, method)
    if code in VK_API_RATE_LIMIT_CODES:
        return VkApiRateLimitError(code, error_msg, method)
    if code == VK_API_CAPTCHA_CODE:
        return VkApiCaptchaError(code, error_msg, method)
    if code == VK_API_INFRA_CODE:
        return VkApiInfrastructureError(code, error_msg, method)
    return VkApiAuthError(code, error_msg, method)
