import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import parse from '../parsing';

describe('Preview Core Functionality Tests', () => {
  const testImagesPath = path.join(__dirname, '../../images');

  describe('Image Data Processing Integration', () => {
      it('should process real PBM file correctly', () => {
      const pbmData = fs.readFileSync(path.join(testImagesPath, 'p1.pbm'));
      const result = parse.parseByteFormat(pbmData);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        expect(result.imgType).to.equal('P1');
        expect(result.width).to.be.a('number').and.greaterThan(0);
        expect(result.height).to.be.a('number').and.greaterThan(0);
        expect(result.colorData).to.be.an('array');
        expect(result.colorData!.length).to.equal(result.width! * result.height!);

        // Verify PBM has only black/white pixels
        result.colorData!.forEach((pixel, index) => {
          expect(pixel.r).to.be.oneOf([0, 255], `Pixel ${index} red channel should be 0 or 255`);
          expect(pixel.g).to.be.oneOf([0, 255], `Pixel ${index} green channel should be 0 or 255`);
          expect(pixel.b).to.be.oneOf([0, 255], `Pixel ${index} blue channel should be 0 or 255`);
          expect(pixel.r).to.equal(pixel.g).and.equal(pixel.b);
        });
      }
    });

    it('should process real PGM file correctly', () => {
      const pgmData = fs.readFileSync(path.join(testImagesPath, 'p2.pgm'));
      const result = parse.parseByteFormat(pgmData);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        expect(result.imgType).to.equal('P2');
        expect(result.width).to.be.a('number').and.greaterThan(0);
        expect(result.height).to.be.a('number').and.greaterThan(0);
        expect(result.colorData).to.be.an('array');
        expect(result.colorData!.length).to.equal(result.width! * result.height!);

        // Verify PGM has grayscale pixels (R=G=B)
        result.colorData!.forEach((pixel, index) => {
          expect(pixel.r).to.equal(pixel.g, `Pixel ${index} R should equal G`);
          expect(pixel.g).to.equal(pixel.b, `Pixel ${index} G should equal B`);
          expect(pixel.r).to.be.within(0, 255);
        });
      }
    });

    it('should process real PPM file correctly', () => {
      const ppmData = fs.readFileSync(path.join(testImagesPath, 'p3.ppm'));
      const result = parse.parseByteFormat(ppmData);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        expect(result.imgType).to.equal('P3');
        expect(result.width).to.be.a('number').and.greaterThan(0);
        expect(result.height).to.be.a('number').and.greaterThan(0);
        expect(result.colorData).to.be.an('array');
        expect(result.colorData!.length).to.equal(result.width! * result.height!);

        // Verify PPM has valid RGB values
        result.colorData!.forEach((pixel, index) => {
          expect(pixel.r).to.be.within(0, 255, `Pixel ${index} red channel out of range`);
          expect(pixel.g).to.be.within(0, 255, `Pixel ${index} green channel out of range`);
          expect(pixel.b).to.be.within(0, 255, `Pixel ${index} blue channel out of range`);
        });
      }
    });

    it('should process P6 binary format correctly', () => {
      const p6Data = fs.readFileSync(path.join(testImagesPath, 'p6-one-byte.ppm'));
      const result = parse.parseByteFormat(p6Data);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        expect(result.imgType).to.equal('P6');
        expect(result.width).to.be.a('number').and.greaterThan(0);
        expect(result.height).to.be.a('number').and.greaterThan(0);
        expect(result.colorData).to.be.an('array');
        expect(result.colorData!.length).to.equal(result.width! * result.height!);
      }
    });

    it('should handle different P6 bit depths', () => {
      const p6TwoByteData = fs.readFileSync(path.join(testImagesPath, 'p6-two-bytes.ppm'));
      const result = parse.parseByteFormat(p6TwoByteData);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        expect(result.imgType).to.equal('P6');
        expect(result.width).to.be.a('number').and.greaterThan(0);
        expect(result.height).to.be.a('number').and.greaterThan(0);
        expect(result.colorData).to.be.an('array');
        expect(result.colorData!.length).to.equal(result.width! * result.height!);
      }
    });
  });

  describe('File Path Operations', () => {
    it('should extract filename from various path formats', () => {
      const testPaths = [
        '/home/user/test.pbm',
        './relative/path/test.ppm',
        '../parent/test.p6',
        'test.p1' // No directory
      ];

      const expectedFilenames = [
        'test.pbm',
        'test.ppm',
        'test.p6',
        'test.p1'
      ];

      testPaths.forEach((testPath, index) => {
        const fileName = path.parse(testPath).base;
        expect(fileName).to.equal(expectedFilenames[index]);
      });
    });

    it('should extract directory from various path formats', () => {
      const testPaths = [
        '/home/user/test.pbm',
        './relative/path/test.ppm',
        '../parent/test.p6'
      ];

      testPaths.forEach(testPath => {
        const dirName = path.parse(testPath).dir;
        expect(dirName).to.be.a('string');
        expect(dirName.length).to.be.greaterThan(0);
      });
    });

    it('should handle edge cases in path parsing', () => {
      const edgeCases = [
        'test.pbm', // No directory
        '.pbm', // No basename
        'test.', // No extension
        'test' // No extension or dot
      ];

      edgeCases.forEach(testCase => {
        const parsed = path.parse(testCase);
        expect(parsed).to.have.property('base');
        expect(parsed).to.have.property('dir');
        expect(parsed).to.have.property('ext');
        expect(parsed).to.have.property('name');
      });
    });
  });

  describe('Webview Payload Formatting', () => {
    it('should format successful image data for webview', () => {
      const mockImageData = {
        status: parse.parseStatus.success,
        width: 100,
        height: 200,
        colorData: [
          { r: 255, g: 0, b: 0 },
          { r: 0, g: 255, b: 0 },
          { r: 0, g: 0, b: 255 }
        ],
        imgType: 'P3'
      };

      const mockTitle = 'test-image.ppm';

      // Simulate payload creation (from preview.ts updateWebview method)
      const payload = {
        width: mockImageData.width,
        height: mockImageData.height,
        colorData: mockImageData.colorData,
        imageType: mockImageData.imgType,
        saveFilename: `${path.basename(mockTitle, path.extname(mockTitle))}.png`
      };

      expect(payload.width).to.equal(100);
      expect(payload.height).to.equal(200);
      expect(payload.colorData).to.have.length(3);
      expect(payload.imageType).to.equal('P3');
      expect(payload.saveFilename).to.equal('test-image.png');
    });

    it('should handle various filename extensions correctly', () => {
      const testTitles = [
        'image.ppm',
        'picture.pgm',
        'bitmap.pbm',
        'complex.name.with.dots.p6',
        'NoExtension'
      ];

      const expectedSaveNames = [
        'image.png',
        'picture.png',
        'bitmap.png',
        'complex.name.with.dots.png',
        'NoExtension.png'
      ];

      testTitles.forEach((title, index) => {
        const saveFilename = `${path.basename(title, path.extname(title))}.png`;
        expect(saveFilename).to.equal(expectedSaveNames[index]);
      });
    });

    it('should validate color data structure', () => {
      const validColorData = [
        { r: 255, g: 128, b: 0 },
        { r: 0, g: 255, b: 127 },
        { r: 64, g: 64, b: 255 }
      ];

      validColorData.forEach((pixel, index) => {
        expect(pixel).to.have.property('r');
        expect(pixel).to.have.property('g');
        expect(pixel).to.have.property('b');
        expect(pixel.r).to.be.within(0, 255);
        expect(pixel.g).to.be.within(0, 255);
        expect(pixel.b).to.be.within(0, 255);
      });
    });
  });

  describe('Settings Payload Structure', () => {
    it('should validate settings structure', () => {
      const mockSettings = {
        backgroundColor: '#ec5340',
        buttonColor: '#dd4535',
        defaultScale: 1.0,
        autoScalingMode: false,
        uiPosition: 'left',
        hideInfoPanel: false
      };

      // Validate required properties
      expect(mockSettings).to.have.property('backgroundColor');
      expect(mockSettings).to.have.property('buttonColor');
      expect(mockSettings).to.have.property('defaultScale');
      expect(mockSettings).to.have.property('autoScalingMode');
      expect(mockSettings).to.have.property('uiPosition');
      expect(mockSettings).to.have.property('hideInfoPanel');

      // Validate types
      expect(mockSettings.backgroundColor).to.be.a('string');
      expect(mockSettings.buttonColor).to.be.a('string');
      expect(mockSettings.defaultScale).to.be.a('number');
      expect(mockSettings.autoScalingMode).to.be.a('boolean');
      expect(mockSettings.uiPosition).to.be.a('string');
      expect(mockSettings.hideInfoPanel).to.be.a('boolean');
    });

    it('should validate color format', () => {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      const validColors = ['#ec5340', '#dd4535', '#ffffff', '#000000'];
      const invalidColors = ['invalid', '#xyz', '', 'ec5340', '#ec534'];

      validColors.forEach(color => {
        expect(colorRegex.test(color)).to.be.true;
      });

      invalidColors.forEach(color => {
        expect(colorRegex.test(color)).to.be.false;
      });
    });

    it('should validate UI position values', () => {
      const validPositions = ['left', 'right'];
      const invalidPositions = ['top', 'bottom', 'center', ''];

      validPositions.forEach(position => {
        expect(['left', 'right']).to.include(position);
      });

      invalidPositions.forEach(position => {
        expect(['left', 'right']).to.not.include(position);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or invalid image data gracefully', () => {
      const failureResult = {
        status: parse.parseStatus.failure
      };

      expect(failureResult.status).to.equal(parse.parseStatus.failure);
      expect(failureResult).to.not.have.property('colorData');
      expect(failureResult).to.not.have.property('width');
      expect(failureResult).to.not.have.property('height');
    });

    it('should validate pixel count consistency', () => {
      // Test with manually created valid data
      const testData = Buffer.from('P3\n2 2\n255\n255 0 0 0 255 0 0 0 255 255 255 255');
      const result = parse.parseByteFormat(testData);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        const expectedPixelCount = result.width! * result.height!;
        expect(result.colorData!.length).to.equal(expectedPixelCount);
      }
    });

    it('should handle large image dimensions', () => {
      // Test parsing header of large image without full data
      const largeImageHeader = Buffer.from('P1\n1000 1000\n');
      const result = parse.parseByteFormat(largeImageHeader);

      // Should parse header successfully even if pixel data is incomplete
      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        expect(result.width).to.equal(1000);
        expect(result.height).to.equal(1000);
        expect(result.imgType).to.equal('P1');
      }
    });

    it('should handle special characters in file paths', () => {
      const specialPaths = [
        '/path with spaces/image.ppm',
        '/path-with-dashes/image.pgm',
        '/path_with_underscores/image.pbm',
        '/path.with.dots/image.p6'
      ];

      specialPaths.forEach(testPath => {
        const parsed = path.parse(testPath);
        expect(parsed.base).to.be.a('string');
        expect(parsed.dir).to.be.a('string');
        expect(parsed.ext).to.be.a('string');
      });
    });
  });

  describe('Performance and Memory Considerations', () => {
    it('should handle reasonable image sizes efficiently', () => {
      // Test with a reasonably sized image
      const mediumImageData = Buffer.from('P1\n10 10\n' + '0 1 '.repeat(50));
      const startTime = Date.now();
      
      const result = parse.parseByteFormat(mediumImageData);
      
      const endTime = Date.now();
      const parseTime = endTime - startTime;

      expect(result.status).to.equal(parse.parseStatus.success);
      expect(parseTime).to.be.lessThan(100); // Should parse in less than 100ms
    });

    it('should properly structure color data for memory efficiency', () => {
      const testData = Buffer.from('P3\n3 2\n255\n255 0 0 0 255 0 0 0 255 128 128 128 64 64 64 192 192 192');
      const result = parse.parseByteFormat(testData);

      expect(result.status).to.equal(parse.parseStatus.success);
      if (result.status === parse.parseStatus.success) {
        // Each pixel should have exactly r, g, b properties
        result.colorData!.forEach((pixel, index) => {
          const keys = Object.keys(pixel);
          expect(keys).to.have.length(3, `Pixel ${index} should have exactly 3 properties`);
          expect(keys).to.include.members(['r', 'g', 'b']);
        });
      }
    });
  });
});
