import logging
from os import environ

logger = logging.getLogger(__name__)

_tracer_provider_set = False


def setup_opentelemetry(service_name: str) -> None:
    global _tracer_provider_set
    if _tracer_provider_set:
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import SERVICE_NAME, Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

        resource = Resource(attributes={SERVICE_NAME: service_name})
        provider = TracerProvider(resource=resource)

        otlp_endpoint = environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
        if otlp_endpoint:
            otlp_exporter = OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces")
            provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
            logger.info("OpenTelemetry OTLP exporter configured, endpoint=%s", otlp_endpoint)
        else:
            provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
            logger.info("OpenTelemetry Console exporter configured (no OTEL_EXPORTER_OTLP_ENDPOINT)")

        trace.set_tracer_provider(provider)
        _tracer_provider_set = True
        logger.info("OpenTelemetry initialized for service=%s", service_name)
    except Exception as exc:
        logger.warning("OpenTelemetry setup skipped: %s", exc)
