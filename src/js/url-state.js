import { ALL_TREES, TRI_STATE } from '@constants';
import {
    encodeQueryParams,
    decodeQueryParams,
    searchStringToObject,
    objectToSearchString,
} from 'serialize-query-params';

const isTree = (t) => ALL_TREES.includes(t);

const TreeSet = {
    encode: (set) => set?.size ? [...set].sort() : undefined,
    decode: (vals) => new Set( [vals].flat().filter(isTree) ),
};

function ConstrainedBy(array, _default = null) {
    const allowed = (val) => array.includes(val);
    return {
        encode: (val) => allowed(val) ? val : undefined,
        decode: (val) => allowed(val) ? val : _default,
    };
}

function FromEnum(obj, key = "YES") {
    return ConstrainedBy(Object.values(obj), obj[key]);
}

const paramConfig = {
    primary: ConstrainedBy(ALL_TREES),
    any: TreeSet,

    source: FromEnum(TRI_STATE),
    singleClass: FromEnum(TRI_STATE),
};

export function load(search = window.location.search) {
    return decodeQueryParams( paramConfig, searchStringToObject(search) );
}

export function save(filter) {
    const url = serialize(filter) || window.location.pathname;
    window.history.replaceState({}, '', url);
}

export function serialize(filter) {
    const encoded = encodeParams(paramConfig, filter);
    const str = objectToSearchString(encoded);
    return str ? `?${str}` : '';
}

function encodeParams(config, params) {
    return encodeQueryParams(config, Object.fromEntries(
        Object.keys(config).map((k) => [k, params[k]])
    ));
}
