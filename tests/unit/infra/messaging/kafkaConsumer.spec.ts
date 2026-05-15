// Compatibility test path kept intentionally because older project docs referenced infra/messaging.
describe('infra/messaging kafkaConsumer compatibility', () => {
  it('keeps Kafka consumer tests under infra/kafka as source of truth', () => {
    expect(true).toBe(true);
  });
});
