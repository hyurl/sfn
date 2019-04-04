declare global {
    namespace app {
        namespace services {
            const test: ModuleProxy<TestService>
        }
    }
}

export default class TestService {
    async *asyncIterator() {
        yield 1;
        yield 2;
        yield 3;
    }
}