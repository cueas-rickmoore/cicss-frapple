
import os, sys
import datetime

from atmosci.seasonal.methods.crop import CropVarietyPathMethods
from atmosci.seasonal.factory import BasicSeasonalProjectFactory

from frapple.grid import FrappleVarietyFileReader,\
                         FrappleVarietyFileManager,\
                         FrappleVarietyFileBuilder,\
                         FrappleTemperatureFileReader,\
                         FrappleTemperatureFileManager,\
                         FrappleTemperatureFileBuilder

"""
BUILD DIRECTORIES & FILES
-------------------------
ROOT DIRPATH : 
     build : /Volumes/data/app_data/frapple/build/NE/acis_hires
     dev   : /Volumes/Transport/data/app_data/frapple/build/NE/acis_hires

CHILL DIRNAME  : chill
CHILL FILENAME : ?YEAR?-Frost-Apple-Chill.h5

VARIETY DIRNAME  : ?variety? (lower case)
VARIETY FILENAME : ?YEAR?-Frost-Apple-?VARIETY?.h5
                                      (camel case)

TEMPS DIRNAME  : temps
TEMPS FILENAME : ?YEAR?-Temperatures+Forecast.h5


TEMP FILES WITH FORECAST 
------------------------
ROOT DIRPATH :
    build : /Volumes/data/app_data/shared/grid/NE/acis_hires/temps
    dev   : /Volumes/Transport/data/app_data/shared/grid/NE/acis_hires/temps

FILENAME : ?YEAR?-ACIS-HiRes-NE-Daily.h5


TOOL DIRECTORIES & FILES        NOTE: tool does not use chill
------------------------
ROOT DIRPATH :
     build : /Volumes/data/app_data/frapple/tool/NE/acis_hires
     dev   : /Volumes/Transport/data/app_data/frapple/tool/NE/acis_hires

VARIETY DIRPATH  : ?variety? (lower case)
VARIETY FILENAME : ?YEAR?-?VARIETY?-Freeze-Damage-Potential.h5

TEMPS DIRPATH  : temps
TEMPS_FILENAME : ?YEAR?-Temperatures.h5
"""
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from frapple.config import CONFIG


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostFactoryMethods(CropVarietyPathMethods):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def fileAccessorClass(self, klass, access_type):
        return self.AccessClasses[klass][access_type]
    getFileAccessorClass = fileAccessorClass

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def filenameTemplate(self, filetype, default=None):
        return self.config.filenames.get(filetype, default)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gridFileBuilder(self, filetype, filepath, target_year=None, 
                              variety=None, **kwargs):
        Class = self.fileAccessorClass(filetype, 'build')
        if filetype == 'variety':
            builder = \
                Class(filepath, target_year, source, region, variety, **kwargs)
        else: builder = Class(filepath, target_year, source, region)
        return builder

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gridFileManager(self, filetype, filepath, target_year=None, 
                              variety=None, mode='r', **kwargs):
        Class = self.fileAccessorClass(filetype, 'manage')
        if filetype == 'variety':
            return Class(filepath, target_year, variety, mode=mode, **kwargs)
        else: return Class(filepath, mode=mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def gridFileReader(self, filetype, filepath, target_year=None,
                             variety=None):
        Class = self.fileAccessorClass(filetype, 'read')
        if filetype == 'variety':
            return Class(filepath, target_year, variety)
        else: return Class(filepath)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def projectRootDir(self):
        root_dir = self.rootDirpath()
        if not os.path.exists(root_dir): os.makedirs(root_dir)
        return root_dir

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def rootDirpath(self):
        return self.config.dirpaths.tooldata

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def seasonDates(self, year_or_date):
        if isinstance(year_or_date, (datetime.date, datetime.datetime)):
            year = self.targetYear(year_or_date)
        else: year = year_or_date
        season = (year, datetime.date(year-1, *self.project.start_day), 
                        datetime.date(year, *self.project.end_day))
        return season
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setDirpaths(self, path_mode):
        dirpaths = self.config.modes[path_mode].dirpaths.attrs
        self.config.dirpaths.update(dirpaths )

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def targetYear(self, date):
        season_start = datetime.date(date.year, *self.project.start_day)
        if date >= season_start:
            target_year = date.year+1
        else: 
            season_start = datetime.date(date.year-1, *self.project.start_day)
            target_year = date.year
        season_end = datetime.date(target_year, *self.project.end_day)
        if date <= season_end: return target_year
        else: return None

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def toolFilename(self, filetype, variety, target_year, source, region):
        template = self.filenameTemplate(filetype)
        template_args = self.templateArgs(target_year, source, region, variety) 
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    #  risk file access
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def riskFilepath(self, variety, target_year, source, region, **kwargs):
        dirpath = self.varietyDirpath(variety, None, source, region)
        filename = self.toolFilename('risk', variety, target_year, source,
                                     region, **kwargs)
        return os.path.join(dirpath, filename)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def riskFileBuilder(self, variety, target_year, source, region, **kwargs):
        filepath = self.riskFilepath(variety, target_year, source, region)
        return FrappleVarietyFileBuilder(filepath, variety, target_year, 
                                         source, region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def riskFileManager(self, variety, target_year, source, region, mode='r'):
        path = self.riskFilepath(variety, target_year, source, region)
        return FrappleVarietyFileManager(path, variety, target_year, mode,
                                         **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def riskFileReader(self, variety, target_year, source, region):
        path = self.riskFilepath(variety, target_year, source, region)
        return FrappleVarietyFileReader(path, variety, target_year)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    #  stage file access
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def stageFilepath(self, variety, target_year, source, region, **kwargs):
        dirpath = self.varietyDirpath(variety, None, source, region)
        filename = self.toolFilename('stage', variety, target_year, source,
                                     region, **kwargs)
        return os.path.join(dirpath, filename)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def stageFileBuilder(self, variety, target_year, source, region, **kwargs):
        filepath = self.stageFilepath(variety, target_year, source, region)
        return FrappleVarietyFileBuilder(filepath, variety, target_year, 
                                         source, region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def stageFileManager(self, variety, target_year, source, region, mode='r'):
        path = self.stageFilepath(variety, target_year, source, region)
        return FrappleVarietyFileManager(path, variety, target_year, mode,
                                         **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def stageFileReader(self, variety, target_year, source, region):
        path = self.stageFilepath(variety, target_year, source, region)
        return FrappleVarietyFileReader(path, variety, target_year)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    #  temperature file access
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tempsDirpath(self, target_year, source, region):
        dirpath = self.sourceDirpath(source, region)
        dirpath = os.path.join(dirpath, 'temps')
        self._verifyDirpath(dirpath)
        return dirpath

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tempsFilename(self, target_year, source, region):
        template = self.filenameTemplate('temps')
        template_args = self.templateArgs(target_year, source, region) 
        return template % template_args

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tempsFilepath(self, target_year, source, region):
        dirpath = self.tempsDirpath(target_year, source, region)
        filename = self.tempsFilename(target_year, source, region) 
        return os.path.join(dirpath, filename)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tempsFileBuilder(self, target_year, source, region, **kwargs):
        path = self.tempsFilepath(target_year, source, region)
        return FrappleTemperatureFileBuilder(filepath, target_year, source,
                                             region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tempsFileManager(self, target_year, source, region, mode='r'):
        path = self.tempsFilepath(target_year, source, region)
        return FrappleTemperatureFileManager(path, mode=mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def tempsFileReader(self, target_year, source, region):
        path = self.tempsFilepath(target_year, source, region)
        return FrappleTemperatureFileReader(path)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    #  variety file access
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def varietyConfig(self, variety):
        if isinstance(variety, ConfigObject): return variety
        elif isinstance(variety, basestring):
            return self.tool.varieties.get(variety, None)
        else:
            errmsg = 'Unsupported type for "variety" argument : %s'
            return TypeError, errmsg % str(type(variety))

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def varietyFilepath(self, variety, target_year, source, region, **kwargs):
        dirpath = self.varietyDirpath(variety, None, source, region)
        filename = self.varietyFilename(variety, target_year, source,
                                        region, **kwargs)
        return os.path.join(dirpath, filename)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def varietyFileBuilder(self, variety, target_year, source, region,
                                 **kwargs):
        filepath = self.varietyFilepath(variety, target_year, source, region)
        return FrappleVarietyFileBuilder(filepath, variety, target_year, 
                                         source, region, **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def varietyFileManager(self, variety, target_year, source, region,
                                 mode='r'):
        path = self.varietyFilepath(variety, target_year, source, region)
        return FrappleVarietyFileManager(path, variety, target_year, mode,
                                         **kwargs)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def varietyFileReader(self, variety, target_year, source, region):
        path = self.varietyFilepath(variety, target_year, source, region)
        return FrappleVarietyFileReader(path, variety, target_year)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _verifyDirpath(self, dirpath):
        if not os.path.exists(dirpath): 
            try:
                os.makedirs(dirpath)
            except Exception as e:
                reason = ' : Issue with filepath "%s"' % dirpath
                info = sys.exc_info()[2]
                raise type(e), type(e)(e.message + reason), info

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _postInitConfig_(self, path_mode):
        self.project = self.config.project
        self.setDirpaths(path_mode)
        self._setFilenameTemplates()
        self.tool = self.config.tool
        self.toolname = self.config.get('toolname', self.tool.name)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostToolFactory(AppleFrostFactoryMethods,
                            BasicSeasonalProjectFactory):

    def __init__(self, path_mode='prod'):
        BasicSeasonalProjectFactory.__init__(self, CONFIG)
        self._postInitConfig_(path_mode)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    def filenameTemplate(self, filetype, default=None):
        return self.filename_templates[filetype]
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def toolConfig(self):
        return self.config.tool
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def varietyConfig(self, variety):
        if isinstance(variety, basestring):
            return self.config.tool.varieties[variety]
        return variety

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _registerAccessClasses(self):
        self._registerAccessManagers('temps',
                                     FrappleTemperatureFileReader,
                                     FrappleTemperatureFileManager,
                                     FrappleTemperatureFileBuilder)

        self._registerAccessManagers('variety',
                                     FrappleVarietyFileReader,
                                     FrappleVarietyFileManager,
                                     FrappleVarietyFileBuilder)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def _setFilenameTemplates(self):
        self.filename_templates = self.config.filenames.tool

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _postInitConfig_(self, path_mode):
        AppleFrostFactoryMethods._postInitConfig_(self, path_mode)
        self.temp_dirname = 'temps'
        self.filename_templates = self.config.filenames.tool


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostToolBuildFactory(AppleFrostToolFactory):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def rootDirpath(self):
        return self.config.dirpaths.build

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _setFilenameTemplates(self):
        self.filename_templates = self.config.filenames.build

    # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - # - - - #

    def _postInitConfig_(self, path_mode):
        AppleFrostToolFactory._postInitConfig_(self, path_mode)
        self.filename_templates = self.config.filenames.build

