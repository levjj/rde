#!/usr/bin/python
# -*- coding: utf-8 -*-

import numpy as np
import matplotlib.pyplot as plt


data = np.genfromtxt('data.csv',
  delimiter=',',
  names=True,
  dtype="S9,S9,S9,i8,i8,f8,f8")

strategies = np.unique(data['Strategy'])
shapes = np.unique(data['StateShape'])
benchmarks = np.unique(data['Benchmark'])

for strat in strategies:
  ds = data[data['Strategy'] == strat]
  for benchmark in benchmarks:
    db = ds[ds['Benchmark'] == benchmark]
    size = np.array([d[3] for d in db])
    size_t = np.sort(np.unique(size))
    events = np.array([d[4] for d in db])
    events_t = np.sort(np.unique(events))
    time = np.array([d[5] for d in db])
    memory = np.array([d[6] for d in db])
    cr = ['r' for k in size]
    cg = ['g' for k in size]

    fig = plt.figure()
    fig.suptitle(benchmark + ' with ' + strat + ' Strategy', fontsize=14, fontweight='bold')
    atim = fig.add_subplot(211)
    atim.set_xlabel('Size of State')
    atim.set_ylabel(u'Time in μs', color='r')
    atim.tick_params(axis='y', color='r', labelcolor='r')
    atim.scatter(size, time, color=cr, marker='+')

    means = [np.mean([d[5] for d in db if d[3] == s]) for s in size_t]
    atim.plot(size_t, means, color='r')

    amem = atim.twinx();
    amem.set_ylabel(u'Memory in bytes', color='g')
    amem.tick_params(axis='y', color='g', labelcolor='g')
    amem.scatter(size, memory, color=cg, marker='x')

    means = [np.mean([d[6] for d in db if d[3] == s]) for s in size_t]
    amem.plot(size_t, means, color='g')

    atim = fig.add_subplot(212)
    atim.set_xlabel('Number of Events')
    atim.set_ylabel(u'Time in μs', color='r')
    atim.tick_params(axis='y', color='r', labelcolor='r')
    atim.scatter(events, time, color=cr, marker='+')

    means = [np.mean([d[5] for d in db if d[4] == e]) for e in events_t]
    atim.plot(size_t, means, color='r')

    amem = atim.twinx();
    amem.set_ylabel(u'Memory in bytes', color='g')
    amem.tick_params(axis='y', color='g', labelcolor='g')
    amem.scatter(events, memory, color=cg, marker='x')

    means = [np.mean([d[6] for d in db if d[4] == e]) for e in events_t]
    amem.plot(size_t, means, color='g')

    plt.show()
    # plt.savefig(benchmark + '_' + strat + '.png')
