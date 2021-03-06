'use strict';

const assert = require('assert');
const watson = require('../../index');
const nock = require('nock');
const qs = require('querystring');
const omit = require('object.omit');

describe('text_to_speech', function() {
  const noop = function() {};

  // Test params
  const service_request = {
    accept: 'audio/ogg; codecs=opus',
    voice: 'VoiceEnUsMichael',
    text: 'Hi test'
  };
  const service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: 'v1'
  };
  const synthesize_path = '/v1/synthesize';
  const voices_path = '/v1/voices';
  const synthesize_request = synthesize_path + '?' + qs.stringify(omit(service_request, 'text'));

  const mock_voices = [
    {
      name: 'michael',
      language: 'en',
      gender: 'male',
      url: 'url'
    },
    {
      name: 'jenny',
      language: 'en',
      gender: 'female',
      url: 'url2'
    }
  ];

  before(function() {
    nock.disableNetConnect();
  });

  after(function() {
    nock.cleanAll();
  });

  const text_to_speech = watson.text_to_speech(service);

  const missingParameter = function(err) {
    assert.ok(err instanceof Error && /required parameters/.test(err));
  };

  describe('synthesize()', function() {
    beforeEach(function() {
      nock(service.url)
        .post(synthesize_request, { text: service_request.text })
        .replyWithFile(200, __dirname + '/../resources/watson-hi.ogg');
    });

    it('should check for missing text', function() {
      const params = {
        voice: service_request.voice,
        accept: service_request.accept
      };
      text_to_speech.synthesize(params, missingParameter);
    });

    it('should check no parameters provided', function() {
      text_to_speech.synthesize({}, missingParameter);
      text_to_speech.synthesize(null, missingParameter);
      text_to_speech.synthesize(undefined, missingParameter);
    });

    it('should generate a valid response', function(done) {
      text_to_speech.synthesize(service_request, function(err, response) {
        if (err) {
          done(err);
        } else {
          assert.notEqual(response, null);
          assert.notEqual(response, undefined);
          assert(response instanceof Buffer);
          done();
        }
      });
    });

    it('should generate a valid payload', function() {
      const req = text_to_speech.synthesize(service_request, noop);
      assert.equal(req.uri.href, service.url + synthesize_request);
      assert.equal(req.method, 'POST');
      assert.equal(req.headers['content-type'], 'application/json');
    });

    it('should support the X-Watson-Learning-Opt-Out option', function() {
      const params = { 'X-Watson-Learning-Opt-Out': true, text: 'test' };
      const req = text_to_speech.synthesize(params, noop);
      assert.equal(req.headers['X-Watson-Learning-Opt-Out'], '1');
    });

    it('should support the customization_id option', function() {
      const params = { customization_id: 'foo', text: 'test' };
      const req = text_to_speech.synthesize(params, noop);
      assert(req.url);
      assert(req.url.query);
      assert.equal(qs.parse(req.url.query).customization_id, 'foo');
    });
  });

  describe('voices()', function() {
    beforeEach(function() {
      nock(service.url)
        .post(synthesize_request, { text: service_request.text })
        .replyWithFile(200, __dirname + '/../resources/watson-hi.ogg')
        .get(voices_path)
        .reply(200, mock_voices);
    });

    it('should generate a valid payload', function(done) {
      const checkVoices = function(err, res) {
        assert.equal(JSON.stringify(res), JSON.stringify(mock_voices));
        done();
      };

      text_to_speech.voices({}, checkVoices);
    });
  });

  describe('voice()', function() {
    beforeEach(function() {
      nock(service.url)
        .get('/v1/voices/en-US_MichaelVoice')
        .reply(200, mock_voices[0]);
    });

    it('should require a voice parameter', function() {
      text_to_speech.voice({}, missingParameter);
      text_to_speech.voice(null, missingParameter);
      text_to_speech.voice(undefined, missingParameter);
    });

    it('should generate a valid payload', function(done) {
      const checkVoice = function(err, res) {
        assert.ifError(err);
        assert.equal(JSON.stringify(res), JSON.stringify(mock_voices[0]));
        done();
      };

      text_to_speech.voice({ voice: 'en-US_MichaelVoice' }, checkVoice);
    });

    it('should support the customization_id option', function() {
      const params = { customization_id: 'foo', voice: 'en-US_MichaelVoice' };
      const req = text_to_speech.voice(params, noop);
      assert(req.url);
      assert(req.url.query);
      assert.equal(qs.parse(req.url.query).customization_id, 'foo');
    });
  });

  describe('pronunciation()', function() {
    const mock_pronunciation = {
      pronunciation: '.ˈaɪ .ˈi .ˈi .ˈi'
    };

    beforeEach(function() {
      nock(service.url)
        .get('/v1/pronunciation?text=IEEE')
        .reply(200, mock_pronunciation);
    });

    it('should require a text parameter', function() {
      text_to_speech.pronunciation({}, missingParameter);
      text_to_speech.pronunciation(null, missingParameter);
      text_to_speech.pronunciation(undefined, missingParameter);
    });

    it('should generate a valid payload', function(done) {
      const checkPronunciation = function(err, res) {
        assert.ifError(err);
        assert.equal(JSON.stringify(res), JSON.stringify(mock_pronunciation));
        done();
      };

      text_to_speech.pronunciation({ text: 'IEEE' }, checkPronunciation);
    });

    it('should support the voice option', function() {
      const params = { text: 'IEEE', voice: 'en-US_MichaelVoice' };
      const req = text_to_speech.pronunciation(params, noop);
      assert(req.url);
      assert(req.url.query);
      assert.equal(qs.parse(req.url.query).voice, 'en-US_MichaelVoice');
    });

    it('should support the customization_id option', function() {
      const params = { text: 'IEEE', customization_id: 'foo' };
      const req = text_to_speech.pronunciation(params, noop);
      assert(req.url);
      assert(req.url.query);
      assert.equal(qs.parse(req.url.query).customization_id, 'foo');
    });
  });
});
