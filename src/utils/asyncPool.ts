/**
 * 并发控制工具函数
 * @param limit 最大并发数（如果 <= 0 则无限制）
 * @param items 要处理的项目数组
 * @param fn 对每个项目执行的异步函数
 * @returns 所有任务的结果数组
 */
export async function asyncPool<T, R>(
    limit: number,
    items: T[],
    fn: (item: T) => Promise<R>,
): Promise<R[]> {
    // 如果 limit 不是正数，则直接并行执行所有任务
    if (limit <= 0) {
        return Promise.all(items.map((item) => fn(item)));
    }

    const ret: Promise<R>[] = [];
    const executing = new Set<Promise<R>>();

    for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        ret.push(p);

        // 当并发任务数达到上限时，等待一个任务完成后再继续。
        const e: Promise<R> = p.finally(() => executing.delete(e));
        executing.add(e);
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(ret);
}
