'use strict';

var Mixin = require('../../utils/mixin'),
    inherits = require('util').inherits;


var PositionTrackingPreprocessorMixin = module.exports = function (preprocessor) {
    // NOTE: avoid installing tracker twice
    if (!preprocessor.posTracker) {
        preprocessor.posTracker = this;

        Mixin.call(this, preprocessor);

        this.preprocessor = preprocessor;
        this.isEol = false;
        this.lineStartPos = 0;
        this.droppedBufferSize = 0;

        this.col = -1;
        this.line = 1;
    }

    return preprocessor.posTracker;
};

inherits(PositionTrackingPreprocessorMixin, Mixin);

Object.defineProperty(PositionTrackingPreprocessorMixin.prototype, 'offset', {
    get: function () {
        return this.droppedBufferSize + this.preprocessor.pos;
    }
});

PositionTrackingPreprocessorMixin.prototype._getOverriddenMethods = function (mxn, orig) {
    return {
        advance: function () {
            var pos = this.pos + 1,
                ch = this.html[pos];

            //NOTE: LF should be in the last column of the line
            if (mxn.isEol) {
                mxn.isEol = false;
                mxn.line++;
                mxn.lineStartPos = pos;
            }

            if (ch === '\n' || ch === '\r' && this.html[pos + 1] !== '\n')
                mxn.isEol = true;

            mxn.col = pos - mxn.lineStartPos + 1;

            return orig.advance.call(this);
        },

        retreat: function () {
            orig.retreat.call(this);

            mxn.isEol = false;
            mxn.col = this.pos - mxn.lineStartPos + 1;
        },

        dropParsedChunk: function () {
            var prevPos = this.pos;

            orig.dropParsedChunk.call(this);

            var reduction = prevPos - this.pos;

            mxn.lineStartPos -= reduction;
            mxn.droppedBufferSize += reduction;
        }
    };
};