import {typeOf} from './symstr';

const stateMembranes = new WeakMap();

class StateMembrane {
  constructor(state) {
    this.proxies = new WeakSet();
    this.objects = new WeakMap();
    this.changes = new WeakMap();
    this.state = this.wrap(state);
    this.frozen = false;
    this.version = -1;
    this.maxVersion = -1;
  }

  /**
   * @param changes [{change: any, version: number]
   * non-empty list of changes for a particular property
   *
   * version=3 means it was changed at version 4 and the current
   * value up to including version 3 is stored in .change
   *
   * @return [number] index of the entry including the current
   * value or *length of versions* if no such entry exists
   */
  lookup(versions) {
    const lastIdx = versions.length - 1;
    // last write was for previous version -> use current value
    if (lastIdx < 0 || versions[lastIdx].version < this.version) return lastIdx + 1;
    // binary search
    let leftIdx = 0;
    let rightIdx = lastIdx;
    while (leftIdx + 1 < rightIdx) {
      const midIdx = 0 | (leftIdx + rightIdx) / 2;
      if (versions[midIdx].version < this.version) {
        leftIdx = midIdx;
      } else {
        rightIdx = midIdx;
      }
    }
    if (leftIdx < rightIdx && versions[leftIdx].version < this.version) {
      leftIdx = rightIdx;
    }
    // leftIdx points to last entry for that version
    return leftIdx;
  }

  wrap(x) {
    if (x === null ||
        (typeOf(x) !== 'object' && typeOf(x) !== 'function') ||
        this.proxies.has(x)) {
      return x;
    }
    if (this.objects.has(x)) {
      return this.objects.get(x);
    }
    const proxy = new Proxy(x, {
      get: (target, key) => {
        if (key === 'prototype') return target[key];
        const changes = this.changes.get(target);
        if (changes && Object.hasOwnProperty.call(changes, key)) {
          const idx = this.lookup(changes[key]);
          if (idx < changes[key].length) {
            return this.wrap(changes[key][idx].change);
          }
        }
        return this.wrap(target[key]);
      },
      set: (target, key, value) => {
        if (this.frozen) {
          throw new TypeError('Mutation to immutable object');
        }
        let objChanges = this.changes.get(target);
        if (!objChanges) {
          objChanges = {};
          this.changes.set(target, objChanges);
        }
        if (!Object.hasOwnProperty.call(objChanges, key)) {
          objChanges[key] = [];
        }
        const versions = objChanges[key];
        const idx = this.lookup(versions);

        let prevValue = target[key];
        if (versions.length > 0 && idx < versions.length) {
          prevValue = versions[idx];
          versions.splice(idx);
        }
        if (idx === 0 || versions[idx - 1].version !== this.version - 1) {
          versions.push({version: this.version - 1, change: prevValue});
        }
        target[key] = value;
        return true;
      },
      ownKeys: (target) => {
        const props = this.changes.get(target);
        const result = props ? Object.keys(props) : [];
        const targetKeys = Object.keys(target);
        for (const k in targetKeys) {
          if (!result.includes(k)) {
            result.push(k);
          }
        }
        return result;
      }
    });
    this.proxies.add(proxy);
    this.objects.set(x, proxy);
    return proxy;
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
  }

  cow() {
    this.version++;
    this.setMaxVersion(this.version);
  }

  timeTravel(version) {
    this.version = version;
  }

  getState() {
    return this.state;
  }

  getMaxVersion() {
    return this.maxVersion;
  }

  setMaxVersion(maxVersion) {
    this.maxVersion = maxVersion;
  }
}

export default function stateMembrane(state) {
  if (stateMembranes.has(state)) {
    return stateMembranes.get(state);
  }
  const membrane = new StateMembrane(state);
  stateMembranes.set(membrane.getState(), membrane);
  return membrane;
}

/**
 * The cow proxy is a little bit like an object capability system.
 * If you have a reference to a certain object (identify) then it
 * obviously existed, so you simply reach it and then do your property
 * lookup locally through all accumulated proxies to find the most
 * recent value of a property.
 *
 * Without proxies, object identities are eternal, and the desired version
 * is used as index into the list of property changes.  Problem: you still
 * have to pay O(n) for looking up unchanged properties in a changing object.
 *
 * Ideally, we would keep a version history per property field.  This would
 * work fine but what about properties that were never changed, so don't
 * have a version history?  Proposed solution: use initial value!
 */
