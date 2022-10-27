import { FSWatcher } from 'chokidar'
import * as singleMd from './singleMd'
import extractConfig from './extractConfig'
import { writeDownMdFile } from './utils'

const FAKE_FIRST_CONTENT = '## fake first markdown Content'
const FAKE_SECOND_CONTENT = '## fake second markdown Content'
const FILES = ['src/comps/button/button.vue']

vi.mock('./utils', () => {
	return {
		writeDownMdFile: vi.fn(() => Promise.resolve())
	}
})

const contentPromises: Promise<{ content: string; dependencies: never[] }>[] = [];

vi.mock('./compileTemplates', () => {
	return {
		default: vi.fn((path, config, filepath) => contentPromises.shift())
	}
})

describe('compile', () => {
	const CWD = 'here'
	const FAKE_FIRST_COMPONENT_PATH = 'here'
	const FAKE_SECOND_COMPONENT_PATH = 'there'
	const MD_FILE_PATH = 'files/docs.md'
	let conf: singleMd.DocgenCLIConfigWithOutFile
	const fakeOn = vi.fn()
	const w = ({
		on: fakeOn.mockImplementation(() => ({ on: fakeOn }))
	} as unknown) as FSWatcher

	beforeEach(() => {
		conf = extractConfig(CWD) as singleMd.DocgenCLIConfigWithOutFile
		conf.components = '**/*.vue'
		conf.outFile = 'files/docs.md'
		conf.getDestFile = vi.fn(() => MD_FILE_PATH)
		contentPromises.splice(0)
		vi.clearAllMocks()
	})

	describe('compile', () => {
		it('should get the current components doc', async () => {
			contentPromises.push(Promise.resolve({ content: FAKE_FIRST_CONTENT, dependencies: [] }));

			await singleMd.compile(conf, [FAKE_FIRST_COMPONENT_PATH], {}, {}, w)
			expect(writeDownMdFile).toHaveBeenCalledWith([FAKE_FIRST_CONTENT], MD_FILE_PATH)
		})
		it('keeps order of documentation snippets for canonical resolved promises', async () => {
			contentPromises.push(Promise.resolve({ content: FAKE_FIRST_CONTENT, dependencies: [] }));
			contentPromises.push(Promise.resolve({ content: FAKE_SECOND_CONTENT, dependencies: [] }))

			await singleMd.compile(conf, [FAKE_FIRST_COMPONENT_PATH, FAKE_SECOND_COMPONENT_PATH], {}, {}, w)
			expect(writeDownMdFile).toHaveBeenCalledWith([FAKE_FIRST_CONTENT, FAKE_SECOND_CONTENT], MD_FILE_PATH)
		})
		it('keeps order of documentation snippets for mixed resolved promises', async () => {
			const p1 = new Promise((resolve, reject) => setTimeout(() => resolve({ content: FAKE_FIRST_CONTENT, dependencies: [] }), 20))
			const p2 = new Promise((resolve, reject) => setTimeout(() => resolve({ content: FAKE_SECOND_CONTENT, dependencies: [] }), 10))
			contentPromises.push(p1, p2)

			await singleMd.compile(conf, [FAKE_FIRST_COMPONENT_PATH, FAKE_SECOND_COMPONENT_PATH], {}, {}, w)
			expect(writeDownMdFile).toHaveBeenCalledWith([FAKE_FIRST_CONTENT, FAKE_SECOND_CONTENT], MD_FILE_PATH)
		})
	})

	describe('default', () => {
		it('should build one md from merging contents', async () => {

			vi.spyOn(singleMd, 'compile').mockImplementation(() => Promise.resolve())
			await singleMd.default(FILES, w, conf, {}, singleMd.compile)
			expect(singleMd.compile).toHaveBeenCalledWith(conf, FILES, {}, {}, w)
		})

		it('should watch file changes if a watcher is passed', async () => {
			conf.watch = true
			fakeOn.mockClear()
			contentPromises.push(Promise.resolve({ content: FAKE_FIRST_CONTENT, dependencies: [] }));
			await singleMd.default(FILES, w, conf, {})
			expect(fakeOn).toHaveBeenCalledWith('add', expect.any(Function))
			expect(fakeOn).toHaveBeenCalledWith('change', expect.any(Function))
		})
	})
})
