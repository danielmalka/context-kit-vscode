---
name: go-performance-review
description: Use when reviewing Go code for performance — concurrency, race conditions, memory retention, goroutine leaks, profiling and benchmark-driven investigation.
---

# Go Performance Review Checklist

This material gathers a practical performance review checklist for Go applications, focused on concurrency, race conditions, memory leaks/retention, goroutine usage, profiling, and investigation flow. The recommendations rely on the use of the race detector, heap and CPU profiles, benchmarking with allocation measurement, and best practices for synchronization and concurrency control.

## Order of Attack

Use this order to avoid premature optimization and focus effort where the gain is real.

- [ ] Reproduce the problem with realistic load or a benchmark.
- [ ] Measure before changing code with `go test -bench . -benchmem ./...`.
- [ ] Run `go test -race ./...` to detect unsafe concurrent access.
- [ ] Collect CPU profile, heap profile, and goroutine profile.
- [ ] Fix proven bottlenecks and compare before/after.
- [ ] Re-run benchmark and race detector after each relevant change.

## Concurrency and Race Conditions Checklist

A data race occurs when two or more goroutines access the same memory at the same time and at least one performs a write, producing timing-dependent behavior. The race detector instruments the binary and reports the stacks of conflicting accesses during execution or tests.

- [ ] Run `go test -race ./...` on every critical package.
- [ ] Also run local binaries with `go run -race` or `go build -race` for flows that tests don't cover.
- [ ] Check maps, counters, caches, slices, and structs shared between goroutines.
- [ ] Confirm that related updates use the same synchronization strategy.
- [ ] Use `sync.Mutex` when multiple fields need to be consistent together.
- [ ] Use `sync/atomic` only for simple state, such as counters and flags.
- [ ] Use channels for coordination and state ownership when the model is about communication, not just mutual exclusion.
- [ ] Avoid mixing `atomic`, `Mutex`, and unprotected access to the same data.
- [ ] Review closures in loops to ensure correct variable capture.
- [ ] Ensure concurrent tests cover real read and write paths.

### Review Questions

- Who owns each piece of shared state?
- Is there a lock-free read on some "seemingly innocent" path?
- Is there a map being read and written by multiple goroutines?
- Does the code depend on execution order not guaranteed by the scheduler?

## Goroutines Checklist

Unbounded concurrency can increase scheduler pressure, memory consumption, and latency, especially when there is blocking I/O or unbounded queues. Many stalled goroutines also retain stacks, references, and resources longer than expected.

- [ ] Count where new goroutines are created and for what reason.
- [ ] Confirm there's no `go func()` inside a loop without a concurrency limit.
- [ ] Implement a worker pool, semaphore, or bounded queue when there's high fan-out.
- [ ] Ensure cancellation via `context.Context` in long-running or chained operations.
- [ ] Close channels correctly when the producer finishes.
- [ ] Avoid consumers stuck forever reading from a channel.
- [ ] Avoid orphaned goroutines started by an HTTP request with no link to the context.
- [ ] Measure the number of goroutines over time via pprof or metrics.
- [ ] Review timers and tickers; always call `Stop()` when the cycle ends.
- [ ] Check pools and queues that may accumulate an unbounded backlog.

### Signs of Trouble

- Continuous growth in the number of goroutines.
- Latency worsens under load even with free CPU.
- Memory consumption grows alongside blocked routines.
- Dumps show many goroutines waiting on the same channel, mutex, or syscall.

## Memory and Retention Checklist

In Go, many "memory leaks" are actually improper retention: references held too long, unbounded caches, slices holding onto large backing arrays, live goroutines, and resources not closed properly. The heap profile helps distinguish a usage peak from sustained growth caused by retention.

- [ ] Compare memory usage across time windows, not just isolated peaks.
- [ ] Collect a heap profile in a scenario with suspected growth.
- [ ] Check the most retained objects, not just the most allocated.
- [ ] Review in-memory caches for a max size, TTL, or expiration policy.
- [ ] Review slices and substrings that keep large backing arrays alive.
- [ ] Copy only the needed portion when retaining a small part of a large buffer.
- [ ] Close `response.Body`, files, connections, and cursors wherever applicable.
- [ ] Review use of `defer` inside hot or long-running loops.
- [ ] Check global structures that grow with requests, tenants, or dynamic keys.
- [ ] Inspect blocked goroutines that hold pointers to large objects.

### Review Questions

- Does the process stabilize after GC or does it keep growing?
- Does the growth come from a cache, queue, map, buffer, or a hung goroutine?
- Is there a global reference preventing collection?
- Is there accidental retention via a slice, closure, or struct kept in a pool?

## Allocation and GC Checklist

Reducing allocation frequently delivers concrete gains in Go, because it lowers pressure on the collector and the runtime. Pre-allocation and reuse tend to be more useful than syntax-level micro-optimizations.

- [ ] Run benchmarks with `-benchmem` to measure allocs/op and bytes/op.
- [ ] Pre-allocate slices and maps when the size is predictable.
- [ ] Avoid building strings with naive concatenation in hot paths; prefer `strings.Builder` when it makes sense.
- [ ] Avoid copying large structs by value in critical paths.
- [ ] Reuse temporary buffers when it simplifies the flow.
- [ ] Consider `sync.Pool` only after profiling proves the benefit.
- [ ] Review interfaces and excessive boxing in very hot paths.
- [ ] Check escape analysis when unnecessary allocation is suspected.
- [ ] Review repeated `[]byte`/`string` conversions in intensive pipelines.
- [ ] Separate local optimizations from larger architectural changes.

## Profiling Checklist

CPU, heap, and goroutine profiles are the most reliable way to locate real runtime bottlenecks. Benchmarks indicate quantitative regression or improvement, while pprof shows where time and memory are concentrated.

- [ ] Enable profile collection in tests or via `net/http/pprof` in services.
- [ ] Capture a CPU profile during representative load.
- [ ] Capture a heap profile after the scenario stabilizes.
- [ ] Capture a goroutine profile when blocking or leaking is suspected.
- [ ] Compare top frames by flat time and cumulative time.
- [ ] Check serialization, regex, reflection, JSON, and database calls in hot paths.
- [ ] Review lock contention when throughput is low in concurrent code.
- [ ] Record a baseline before the change and compare afterward.

## I/O, Network, and Database Checklist

Not every problem is CPU or heap; many Go applications lose performance due to external contention, excessive round-trips, and missing timeouts. Adjustments at these layers avoid stuck goroutines and reduce backlog under load.

- [ ] Set timeouts for HTTP client, context, and database.
- [ ] Reuse HTTP connections and transports correctly.
- [ ] Avoid creating an HTTP client per request.
- [ ] Review N+1 queries, large payloads, and redundant serialization.
- [ ] Apply backpressure when consumers fall behind producers.
- [ ] Measure dependency latency before "blaming Go."

## CI and Regression Prevention Checklist

Putting benchmarks and the race detector in the routine reduces regressions that are hard to notice in manual review. The goal is to make concurrency problems and allocation waste visible as early as possible.

- [ ] Run `go test ./...` on every push.
- [ ] Run `go test -race ./...` at least on main branches or critical suites.
- [ ] Maintain benchmarks for sensitive components.
- [ ] Compare before/after results in performance PRs.
- [ ] Record optimization decisions with hypothesis, evidence, and result.

## Performance Review Template

Use this template in a PR, internal audit, or incident investigation.

### 1. Context

- Service/component:
- Endpoint/job/consumer affected:
- Main symptom: high CPU, growing memory, latency, low throughput, apparent deadlock, race, other.
- Environment: local, staging, production.
- How to reproduce:

### 2. Baseline

- Commit/base analyzed:
- Load used in the test:
- Benchmark run:
- Initial result (`ns/op`, `allocs/op`, `B/op`):
- Initial goroutine count:
- Initial memory/heap usage:

### 3. Concurrency Verification

- [ ] `go test -race ./...` run.
- [ ] Flows outside of tests covered with `go run -race` or an instrumented binary.
- [ ] Shared state identified.
- [ ] Synchronization strategy validated (`Mutex`, `RWMutex`, `atomic`, channels).
- [ ] Loops with goroutines reviewed.
- [ ] Contexts and cancellation reviewed.

Notes:

### 4. Goroutine Verification

- [ ] Fan-out bounded.
- [ ] Worker pool/semaphore used when necessary.
- [ ] No orphaned goroutine per request.
- [ ] Channels closed correctly.
- [ ] Timers/tickers stopped.
- [ ] Goroutine profile analyzed.

Notes:

### 5. Memory Verification

- [ ] Heap profile collected.
- [ ] Main retained objects identified.
- [ ] Caches with limit/TTL.
- [ ] Resources closed correctly.
- [ ] Slices/buffers reviewed.
- [ ] Global structures reviewed.

Notes:

### 6. Allocation Verification

- [ ] Benchmark with `-benchmem` analyzed.
- [ ] Pre-allocation applied where it made sense.
- [ ] Unnecessary copies removed.
- [ ] `sync.Pool` evaluated only with evidence.
- [ ] Hot conversions and serializations reviewed.

Notes:

### 7. Profiling

- CPU profile:
- Heap profile:
- Goroutine profile:
- Main hotspots:
- External dependency involved:

### 8. Changes Made

- Change 1:
- Hypothesis:
- Evidence before:
- Result after:

- Change 2:
- Hypothesis:
- Evidence before:
- Result after:

### 9. Final Result

- Final benchmark:
- Percentage change:
- Final memory:
- Final goroutines:
- Trade-offs introduced:
- Residual risk:

### 10. Next Steps

- [ ] Add a regression test/benchmark.
- [ ] Instrument a missing metric.
- [ ] Review another related area.
- [ ] Document the pattern for the team.

## Makefile Template

This template automates testing, benchmarking, race detection, and basic profiles, aligning with the recommended flow of benchmarking, race detection, and profile collection. Adjust variables such as `PKG`, `BENCH`, `RUN`, and `BIN` for your project.

```makefile
GO ?= go
PKG ?= ./...
BENCH ?= .
RUN ?= .
BIN ?= ./cmd/app
OUT ?= ./.perf

.PHONY: test race bench benchcmp cpu mem mutex block profile clean run-race

test:
	$(GO) test $(PKG)

race:
	$(GO) test -race $(PKG)

bench:
	mkdir -p $(OUT)
	$(GO) test -run='^$$' -bench='$(BENCH)' -benchmem $(PKG) | tee $(OUT)/bench.txt

cpu:
	mkdir -p $(OUT)
	$(GO) test -run='^$$' -bench='$(BENCH)' -cpuprofile $(OUT)/cpu.out $(PKG)
	$(GO) tool pprof -top $(OUT)/cpu.out

mem:
	mkdir -p $(OUT)
	$(GO) test -run='^$$' -bench='$(BENCH)' -memprofile $(OUT)/mem.out $(PKG)
	$(GO) tool pprof -top $(OUT)/mem.out

mutex:
	mkdir -p $(OUT)
	$(GO) test -run='^$$' -bench='$(BENCH)' -mutexprofile $(OUT)/mutex.out $(PKG)
	$(GO) tool pprof -top $(OUT)/mutex.out

block:
	mkdir -p $(OUT)
	$(GO) test -run='^$$' -bench='$(BENCH)' -blockprofile $(OUT)/block.out $(PKG)
	$(GO) tool pprof -top $(OUT)/block.out

profile: cpu mem mutex block

run-race:
	$(GO) run -race $(BIN)

clean:
	rm -rf $(OUT)
```

## CI Script Template

This shell script can be used in simple CI to fail fast on tests, race detector, and benchmark smoke tests. It helps make concurrency regressions visible early in the pipeline.

```bash
#!/usr/bin/env bash
set -euo pipefail

mkdir -p .perf

echo "==> unit tests"
go test ./...

echo "==> race detector"
go test -race ./...

echo "==> benchmark smoke"
go test -run='^$' -bench='.' -benchmem ./... | tee .perf/bench-ci.txt
```

## Useful Commands

```bash
# normal tests
go test ./...

# race detector
go test -race ./...

# benchmark with memory
go test -run='^$' -bench='.' -benchmem ./...

# CPU profile
go test -run='^$' -bench='BenchmarkMyFunction$' -cpuprofile cpu.out ./...
go tool pprof -http=:8080 cpu.out

# Heap profile
go test -run='^$' -bench='BenchmarkMyFunction$' -memprofile mem.out ./...
go tool pprof -http=:8080 mem.out
```

## Quick Interpretation

- If `-race` fails, fix concurrency before discussing micro-performance, because the functional result is already compromised.
- If `allocs/op` and `B/op` drop but `ns/op` doesn't improve, the main bottleneck might be I/O, lock contention, or an external dependency.
- If the heap grows and the number of goroutines grows too, investigate routine leaks, blocked channels, and reference retention.
- If the CPU profile points to serialization, reflection, or string handling, focus on those hot paths first before touching cosmetic details.
